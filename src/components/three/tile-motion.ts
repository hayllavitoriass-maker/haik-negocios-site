import { Quaternion, Vector3 } from "three";
import { FORMATIONS, createPose, formations, type FormationParams } from "./formations";
import type { TileSeeds } from "./seeds";
import type { Formation } from "./stage-store";

/**
 * Movimento de um tile entre formações.
 *
 * Cada tile mantém um peso por formação, amortecido (fator 3.5) em direção a 1 para a
 * formação ativa e 0 para as demais, com atraso por índice `0.5·(0.75·i/(n-1) + 0.25·rand)`.
 * A pose final é a média ponderada das poses "ao vivo" de cada formação com peso > 0
 * (posição e escala lineares, rotação por nlerp de quatérnios), mais um arco vertical
 * `sin(π·w)` durante a troca. Um segundo amortecimento curto (fator 6) sobre a pose final
 * absorve descontinuidades internas de uma formação (troca de foco, loop do túnel).
 */
const WEIGHT_DAMP = 3.5;
const POSE_DAMP = 6;
const ARC_HEIGHT = 1.1;
/** Salto do alvo (u/frame) acima do qual a pose é copiada em vez de amortecida. */
const TELEPORT = 15;
const EPS = 1e-3;
const UP = new Vector3(0, 1, 0);

function clamp01(x: number) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

export class TileMotion {
  readonly position = new Vector3();
  readonly quaternion = new Quaternion();
  scale = 0;
  /** Atraso (s) antes de este tile começar a reagir a uma troca de formação. */
  readonly delay: number;

  private readonly weights: Record<Formation, number>;
  private target: Formation;
  private switchedAt = 0;
  private started = false;

  // Buffers reutilizados (zero alocações por frame)
  private readonly pose = createPose();
  private readonly q = new Quaternion();
  private readonly qRef = new Quaternion();
  private readonly blendPos = new Vector3();
  private readonly prevBlend = new Vector3();
  private readonly blendQ = new Quaternion();
  private readonly spin = new Quaternion();
  private blendScale = 0;

  constructor(
    readonly index: number,
    readonly count: number,
    readonly seeds: TileSeeds,
    initial: Formation,
    /** Instante (s) em que o tile nasce: a entrada respeita o atraso por índice a partir daí. */
    startAt = 0,
  ) {
    const u = count > 1 ? index / (count - 1) : 0;
    this.delay = 0.5 * (0.75 * u + 0.25 * seeds.c);
    this.weights = Object.fromEntries(FORMATIONS.map((f) => [f, 0])) as Record<Formation, number>;
    this.target = initial;
    this.switchedAt = startAt;
  }

  get formation() {
    return this.target;
  }

  setFormation(next: Formation, now: number) {
    if (next === this.target) return;
    this.target = next;
    this.switchedAt = now;
  }

  /**
   * Composição global, independente da formação:
   * - retrato: comprime a formação numa faixa baixa (a câmera olha +2 acima, ver
   *   camera-keys.ts), afasta e reduz — o texto centralizado fica livre;
   * - presença baixa (`intensity` < 0.6, páginas internas): comprime e leva tudo para o
   *   terço direito e para o fundo, atrás e à direita da coluna de texto;
   * - escala geral acompanha a intensidade.
   */
  private compose(params: FormationParams) {
    const p = this.blendPos;
    const intensity = clamp01(params.intensity);
    // 0 = presença normal (≥ 0.6), 1 = presença baixa (< 0.6; degrau suave de 0.03)
    const low = clamp01((0.6 - intensity) / 0.03);

    if (params.portrait) {
      // faixa inferior (~40% da tela): achata em y e z, afasta e reduz
      // Em páginas internas (presença baixa) vai mais para trás e para a direita, para não
      // ficar sob o texto corrido que rola por cima.
      p.x = p.x * 0.8 + 1.4 * low;
      p.y = p.y * 0.28 - 0.45 - 0.6 * low;
      p.z = p.z * 0.35 - 2.5 - 4 * low;
      this.blendScale *= 0.68 - 0.24 * low;
    } else if (low > 0) {
      // centro-alvo no terço direito: ~68% do meio-largura visível à profundidade ~15
      const depth = 15;
      const xCenter = 0.68 * depth * Math.tan((40 * Math.PI) / 360) * Math.max(1, params.aspect);
      p.x += (xCenter + p.x * 0.25 - p.x) * low;
      p.y += (p.y * 0.5 + 0.2 - p.y) * low;
      p.z += (p.z * 0.6 - 4 - p.z) * low;
      this.blendScale *= 1 - 0.38 * low;
    }

    this.blendScale *= 0.85 + 0.15 * intensity;
  }

  /**
   * @param now   tempo da cena (s)
   * @param dt    delta do frame (s), já limitado
   * @param params parâmetros compartilhados; os seeds são preenchidos aqui
   * @param snap  true = sem amortecimento (prefers-reduced-motion)
   */
  update(now: number, dt: number, params: FormationParams, snap: boolean) {
    params.seed = this.seeds.a;
    params.seed2 = this.seeds.b;
    params.seed3 = this.seeds.c;

    // 1. pesos por formação (congelados até o atraso do tile vencer)
    const gate = snap || now - this.switchedAt >= this.delay;
    const k = snap ? 1 : 1 - Math.exp(-WEIGHT_DAMP * dt);
    let sum = 0;
    for (const f of FORMATIONS) {
      const goal = f === this.target ? 1 : 0;
      let w = this.weights[f];
      if (gate) w += (goal - w) * k;
      if (goal === 0 && w < EPS) w = 0;
      this.weights[f] = w;
      sum += w;
    }

    // 2. mistura ponderada das poses ao vivo (a formação alvo é a referência de hemisfério)
    const target = formations[this.target](this.index, this.count, params, this.pose);
    this.qRef.setFromEuler(target.rotation);
    if (sum < EPS) {
      // intro: nasce já na pose alvo, crescendo do zero
      this.blendPos.copy(target.position);
      this.blendQ.copy(this.qRef);
      this.blendScale = target.scale * (sum / EPS);
    } else {
      const wt = this.weights[this.target];
      this.blendPos.copy(target.position).multiplyScalar(wt);
      this.blendScale = target.scale * wt;
      let qx = this.qRef.x * wt;
      let qy = this.qRef.y * wt;
      let qz = this.qRef.z * wt;
      let qw = this.qRef.w * wt;
      for (const f of FORMATIONS) {
        if (f === this.target) continue;
        const w = this.weights[f];
        if (w <= 0) continue;
        const pose = formations[f](this.index, this.count, params, this.pose);
        this.blendPos.addScaledVector(pose.position, w);
        this.blendScale += pose.scale * w;
        this.q.setFromEuler(pose.rotation);
        // mesmo hemisfério que a referência: evita o caminho longo no nlerp
        const sign = this.q.dot(this.qRef) < 0 ? -w : w;
        qx += this.q.x * sign;
        qy += this.q.y * sign;
        qz += this.q.z * sign;
        qw += this.q.w * sign;
      }
      const inv = 1 / sum;
      this.blendPos.multiplyScalar(inv);
      this.blendScale *= inv;
      this.blendQ.set(qx, qy, qz, qw).normalize();
    }

    // 3. arco vertical + leve giro durante a transição (0 nas extremidades)
    const wt = this.weights[this.target];
    if (!snap && wt < 0.999) {
      const arc = Math.sin(Math.PI * wt);
      this.blendPos.y += arc * ARC_HEIGHT;
      this.spin.setFromAxisAngle(UP, arc * (this.seeds.b - 0.5) * 1.2);
      this.blendQ.multiply(this.spin);
    }

    // 4. composição global (vale para TODAS as formações)
    this.compose(params);

    // 5. continuidade: amortecimento curto da pose final.
    //    Exceções que teleportam: alvo invisível (escala ~0) ou um salto intencional da
    //    formação (> TELEPORT u num frame, ex.: o loop do túnel) — nunca movimento contínuo.
    const jump = this.started ? this.blendPos.distanceTo(this.prevBlend) : 0;
    this.prevBlend.copy(this.blendPos);
    const invisible = this.scale < 0.01 && this.blendScale < 0.01;
    if (snap || !this.started || invisible || jump > TELEPORT) {
      this.position.copy(this.blendPos);
      this.quaternion.copy(this.blendQ);
      this.scale = this.blendScale;
      this.started = true;
    } else {
      const kp = 1 - Math.exp(-POSE_DAMP * dt);
      this.position.lerp(this.blendPos, kp);
      this.quaternion.slerp(this.blendQ, kp);
      this.scale += (this.blendScale - this.scale) * kp;
    }
  }
}
