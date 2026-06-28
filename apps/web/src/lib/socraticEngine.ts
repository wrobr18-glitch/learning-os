/**
 * Socratic AI Response Engine for UGC NET Electronics
 */

export function getSocraticResponse(query: string): string {
  const q = query.toLowerCase();

  /* ── Topic Detection (most specific first) ── */
  const isOpticalFiber   = /optical fiber|fibre|fiber optic|total internal reflection|numerical aperture|acceptance angle|single.?mode|multi.?mode|graded.?index|step.?index|attenuation|dispersion|refractive index|snell|cladding|core/.test(q);
  const isCommunication  = /modulation|demodulation|am\b|fm\b|pm\b|pcm|ask|fsk|psk|qam|bandwidth|noise|snr|channel capacity|shannon|nyquist|multiplexing|tdm|fdm|cdm|superheterodyne|carrier|antenna|propagation|radar|receiver|transmitter/.test(q);
  const isDigital        = /logic gate|boolean|flip.?flop|counter|register|mux|demux|encoder|decoder|adder|subtractor|binary|hex|bcd|k.?map|karnaugh|sequential|combinational|nand|nor|xor|sop|pos|minimiz/.test(q);
  const isSignals        = /fourier|laplace|z.transform|convolution|impulse|step function|transfer function|frequency response|bode|pole|zero|roc|dtft|dft|fft|lti|linear time|causal|stable|signal|spectrum/.test(q);
  const isControl        = /control system|pid|proportional|integral|derivative|closed.?loop|open.?loop|stability|routh|nyquist criterion|root locus|gain margin|phase margin|steady.?state error|type.?0|type.?1/.test(q);
  const isEM             = /maxwell|electromagnetic|electric field|magnetic field|gauss|faraday|ampere|poynting|waveguide|transmission line|impedance matching|vswr|antenna|radiation|dipole|microstrip|skin effect|permittivity|permeability/.test(q);
  const isMicro          = /microprocessor|8085|8086|8051|assembly|instruction|register|accumulator|interrupt|memory|stack|bus|alu|addressing mode|opcode/.test(q);
  const isNetwork        = /thevenin|norton|superposition|mesh|nodal|kvl|kcl|network|circuit|resistor|capacitor|inductor|impedance|admittance|resonance|filter|two.?port|h.?param|y.?param|z.?param/.test(q);
  const isBJT            = /bjt|bipolar|hfe|h_fe|\bbeta\b|collector|emitter|base current|npn|pnp|common.?emitter|common.?base|common.?collector|transistor/.test(q);
  const isMOSFET         = /mosfet|transconductance|gm\b|g_m|drain|gate|threshold|vgs|vds|vth|pinch.?off|overdrive|mos|cmos/.test(q);
  const isDiode          = /\bdiode\b|p.?n junction|forward bias|reverse bias|depletion|shockley|zener|rectifier|clipping|clamping|photodiode|led\b/.test(q);
  const isOpAmp          = /op.?amp|operational amplifier|inverting|non.?inverting|virtual ground|cmrr|slew rate|gain bandwidth|integrator|differentiator/.test(q);
  const isSemiconductor  = /semiconductor|band.?gap|valence|conduction band|doping|donor|acceptor|intrinsic|fermi|carrier|mobility|drift|diffusion/.test(q);
  const isFET            = /\bfet\b|field.?effect|jfet|idss|pinch.?off voltage/.test(q);

  if (isOpticalFiber) {
    return `## Optical Fiber Communication — Socratic Session

> [!KEY]
> Optical fibers transmit light via **Total Internal Reflection (TIR)**. Light is confined inside the core because the core has a higher refractive index than the cladding: $n_1 > n_2$.

---

## Total Internal Reflection — The Core Principle

TIR occurs when light hits the core-cladding boundary at an angle **greater than the critical angle** $\\theta_c$:

$$\\sin \\theta_c = \\frac{n_2}{n_1}$$

If the angle of incidence $> \\theta_c$, light is **totally reflected** — none escapes into the cladding.

---

## Numerical Aperture (NA)

The NA determines **how much light the fiber can accept** from outside. It defines the **acceptance cone**:

$$\\text{NA} = \\sin \\theta_{acc} = \\sqrt{n_1^2 - n_2^2}$$

> [!FORMULA]
> For small index differences: $\\text{NA} \\approx n_1 \\sqrt{2\\Delta}$ where $\\Delta = \\frac{n_1 - n_2}{n_1}$ is the **relative refractive index difference**.

---

## Types of Optical Fibers

### Step-Index Single-Mode (SM)
- Core diameter: $\\approx 8\\text{–}10\\,\\mu\\text{m}$
- One propagation mode, **zero modal dispersion**
- Used in long-haul telecommunications

### Step-Index Multi-Mode (MM)
- Core diameter: $\\approx 50\\text{–}200\\,\\mu\\text{m}$
- Multiple modes → **modal dispersion** limits bandwidth
- Used in LANs and short distances

### Graded-Index Multi-Mode
- Refractive index varies **parabolically** from core center
- Compensates for modal dispersion → higher bandwidth than step-index MM

---

## Fiber Losses (Attenuation)

$$\\alpha_{dB} = -\\frac{10}{L} \\log_{10}\\left(\\frac{P_{out}}{P_{in}}\\right) \\quad [\\text{dB/km}]$$

Loss mechanisms:
- **Rayleigh scattering**: $\\propto 1/\\lambda^4$ — dominant at short wavelengths
- **Absorption**: material impurities (OH⁻ ions)
- **Bending losses**: macro and micro-bends

> [!NOTE]
> Minimum attenuation for silica fiber occurs at $\\lambda \\approx 1550\\,\\text{nm}$ (≈ 0.2 dB/km). This is the **third telecom window**.

---

## Checkpoint

A fiber has $n_1 = 1.48$, $n_2 = 1.46$. Calculate:
1. Critical angle $\\theta_c$
2. Numerical aperture NA
3. Acceptance angle $\\theta_{acc}$ in air`;
  }

  if (isCommunication) {
    return `## Communication Systems — Socratic Session

> [!KEY]
     * Every communication system has three elements: **Transmitter** (modulates the signal), **Channel** (introduces noise and distortion), and **Receiver** (demodulates to recover original signal).

---

## Amplitude Modulation (AM)

The modulated signal for AM:

$$s(t) = A_c [1 + k_a m(t)] \\cos(2\\pi f_c t)$$

For a sinusoidal message $m(t) = A_m \\cos(2\\pi f_m t)$, the **modulation index** is:

$$\\mu = k_a A_m = \\frac{A_{max} - A_{min}}{A_{max} + A_{min}}$$

> [!FORMULA]
> **AM Power efficiency:** $\\eta = \\frac{\\mu^2/2}{1 + \\mu^2/2}$ — only the sidebands carry information!

---

## Frequency Modulation (FM)

$$s(t) = A_c \\cos\\left[2\\pi f_c t + 2\\pi k_f \\int_0^t m(\\tau)\\,d\\tau\\right]$$

**FM index:** $\\beta = \\frac{\\Delta f}{f_m} = \\frac{k_f A_m}{f_m}$

**Carson's Rule** (FM bandwidth approximation):
$$B_T \\approx 2(\\beta + 1) f_m = 2(\\Delta f + f_m)$$

---

## Shannon-Hartley Channel Capacity

$$C = B \\log_2\\left(1 + \\frac{S}{N}\\right) \\quad [\\text{bits/sec}]$$

where $B$ = bandwidth (Hz) and $S/N$ = signal-to-noise ratio (linear).

> [!NOTE]
> This is the **theoretical maximum** data rate. Practical systems achieve 60–70% of Shannon capacity.

---

## Checkpoint

An AM signal has carrier amplitude $A_c = 10\\,\\text{V}$ and modulation index $\\mu = 0.6$. Calculate:
1. $A_{max}$
2. Total AM power relative to unmodulated carrier power
3. Efficiency $\\eta$`;
  }

  if (isDigital) {
    return `## Digital Electronics — Socratic Session

> [!KEY]
> Digital systems operate on **binary signals** (0 and 1). The power of digital design comes from **Boolean algebra**, which lets us simplify complex logic into minimal gate circuits.

---

## Boolean Algebra Laws

- **Idempotent:** $A + A = A$, $A \\cdot A = A$
- **Complement:** $A + \\bar{A} = 1$, $A \\cdot \\bar{A} = 0$
- **DeMorgan's Theorems:**

$$\\overline{A + B} = \\bar{A} \\cdot \\bar{B} \\qquad \\overline{A \\cdot B} = \\bar{A} + \\bar{B}$$

> [!KEY]
> **NAND and NOR are universal gates** — any Boolean function can be implemented using only NAND gates or only NOR gates.

---

## Karnaugh Map (K-Map) Minimization

Steps for minimizing a Boolean function:
1. Fill the K-map with the truth table output values
2. Group **1s** (for SOP) in groups of $2^n$ (1, 2, 4, 8...)
3. Groups must be **rectangular** and wrap around edges
4. Largest possible groups give fewest literals
5. Write the minimal SOP expression

---

## Flip-Flop Types

| Flip-Flop | Trigger | Behavior |
|-----------|---------|----------|
| SR | Edge | Set/Reset, forbidden state when $S=R=1$ |
| D | Edge | $Q_{n+1} = D$ (data latch) |
| JK | Edge | $J=K=1$ → **toggle** (no forbidden state) |
| T | Edge | $Q_{n+1} = Q_n \\oplus T$ (toggle on T=1) |

---

## Checkpoint

Minimize $F(A,B,C,D) = \\sum m(0,1,2,5,8,9,10)$ using a K-map. Group the minterms optimally and write the minimal SOP expression.`;
  }

  if (isSignals) {
    return `## Signals & Systems — Socratic Session

> [!KEY]
> A **Linear Time-Invariant (LTI)** system is completely characterized by its **impulse response** $h(t)$. The output for any input is the **convolution** of input with the impulse response.

---

## Convolution

$$y(t) = x(t) * h(t) = \\int_{-\\infty}^{\\infty} x(\\tau)\\, h(t - \\tau)\\, d\\tau$$

**Key property:** Convolution in time domain $\\leftrightarrow$ **Multiplication** in frequency domain:

$$Y(\\omega) = X(\\omega) \\cdot H(\\omega)$$

---

## Fourier Transform Pairs

| Signal | Fourier Transform |
|--------|------------------|
| $\\delta(t)$ | $1$ |
| $1$ | $2\\pi\\delta(\\omega)$ |
| $e^{-at}u(t)$ | $\\frac{1}{a + j\\omega}$ |
| $\\text{rect}(t/T)$ | $T\\,\\text{sinc}(\\omega T/2)$ |

---

## Laplace Transform

$$\\mathcal{L}\\{f(t)\\} = F(s) = \\int_0^\\infty f(t) e^{-st}\\,dt$$

> [!FORMULA]
> **Transfer function:** $H(s) = \\frac{Y(s)}{X(s)}$ — ratio of output to input in s-domain (zero initial conditions).

**Poles** determine stability: if all poles are in the **left half of the s-plane** (Re{s} < 0), the system is **BIBO stable**.

---

## Z-Transform (Discrete-Time)

$$X(z) = \\sum_{n=-\\infty}^{\\infty} x[n]\\, z^{-n}$$

Stability condition: all poles must lie **inside the unit circle** $|z| < 1$ in the z-plane.

---

## Checkpoint

Find the transfer function $H(s) = Y(s)/X(s)$ for a system described by:

$$\\frac{d^2y}{dt^2} + 5\\frac{dy}{dt} + 6y(t) = x(t)$$

Then determine its poles and assess stability.`;
  }

  if (isControl) {
    return `## Control Systems — Socratic Session

> [!KEY]
> A **closed-loop (feedback) control system** uses the output to correct the input. The **transfer function** of a closed-loop system with forward gain $G(s)$ and feedback gain $H(s)$ is:
> $$T(s) = \\frac{G(s)}{1 + G(s)H(s)}$$

---

## System Type and Steady-State Error

The system **type** is the number of open-loop poles at the origin $s = 0$:

| System Type | Unit Step Error $e_{ss}$ | Unit Ramp Error | Unit Parabola Error |
|------------|--------------------------|-----------------|---------------------|
| Type 0 | $\\frac{1}{1+K_p}$ | $\\infty$ | $\\infty$ |
| Type 1 | $0$ | $\\frac{1}{K_v}$ | $\\infty$ |
| Type 2 | $0$ | $0$ | $\\frac{1}{K_a}$ |

---

## Routh-Hurwitz Stability Criterion

For a characteristic equation $a_n s^n + \\cdots + a_1 s + a_0 = 0$, the system is **stable** if and only if all elements in the **first column** of the Routh array are **positive**.

Number of sign changes in the first column = number of **closed-loop poles in the RHP**.

---

## Bode Plot Rules

For a factor $(1 + j\\omega\\tau)$:
- Below $\\omega = 1/\\tau$: 0 dB/decade slope contribution
- Above $\\omega = 1/\\tau$: +20 dB/decade slope contribution
- Phase shifts from 0° to +90° over 2 decades around the corner frequency

> [!FORMULA]
> **Gain Margin (GM):** $GM = -20\\log|G(j\\omega_{pc})|$ dB, where $\\omega_{pc}$ is the phase crossover frequency.
> **Phase Margin (PM):** $PM = 180° + \\angle G(j\\omega_{gc})$, where $\\omega_{gc}$ is the gain crossover frequency.

---

## Checkpoint

For $G(s) = \\frac{10}{s(s+1)(s+10)}$, find the gain margin and phase margin using the Bode plot approach.`;
  }

  if (isEM) {
    return `## Electromagnetic Theory — Socratic Session

> [!KEY]
> Maxwell's four equations govern **all classical electromagnetic phenomena**. They unify electricity, magnetism, and optics into a single framework.

---

## Maxwell's Equations (Differential Form)

$$\\nabla \\cdot \\mathbf{D} = \\rho_v \\quad \\text{(Gauss's Law — Electric)}$$

$$\\nabla \\cdot \\mathbf{B} = 0 \\quad \\text{(Gauss's Law — Magnetic: no magnetic monopoles)}$$

$$\\nabla \\times \\mathbf{E} = -\\frac{\\partial \\mathbf{B}}{\\partial t} \\quad \\text{(Faraday's Law)}$$

$$\\nabla \\times \\mathbf{H} = \\mathbf{J} + \\frac{\\partial \\mathbf{D}}{\\partial t} \\quad \\text{(Ampere-Maxwell Law)}$$

> [!KEY]
> The term $\\frac{\\partial \\mathbf{D}}{\\partial t}$ is Maxwell's **displacement current** — it was the key insight that predicted electromagnetic waves.

---

## Wave Equation and Propagation

From Maxwell's equations in free space:

$$\\nabla^2 \\mathbf{E} = \\mu_0 \\epsilon_0 \\frac{\\partial^2 \\mathbf{E}}{\\partial t^2}$$

This is a **wave equation** with speed:

$$c = \\frac{1}{\\sqrt{\\mu_0 \\epsilon_0}} \\approx 3 \\times 10^8\\,\\text{m/s}$$

---

## Poynting Vector

The **power flow** per unit area in an EM wave:

$$\\mathbf{S} = \\mathbf{E} \\times \\mathbf{H} \\quad [\\text{W/m}^2]$$

---

## Checkpoint

Using Gauss's law, find the **electric field** at a distance $r$ from an infinite line charge with linear charge density $\\lambda$ (C/m). Use a cylindrical Gaussian surface.`;
  }

  if (isMicro) {
    return `## Microprocessors — Socratic Session

> [!KEY]
> The **8085** is an 8-bit microprocessor with a 16-bit address bus (64 KB addressable memory) and an 8-bit data bus. It uses **von Neumann architecture** — shared memory for data and instructions.

---

## 8085 Internal Registers

| Register | Size | Purpose |
|----------|------|---------|
| A (Accumulator) | 8-bit | All arithmetic/logic operations |
| B, C, D, E, H, L | 8-bit | General purpose |
| SP (Stack Pointer) | 16-bit | Points to top of stack |
| PC (Program Counter) | 16-bit | Address of next instruction |
| Flags | 8-bit | S, Z, AC, P, CY (status flags) |

---

## Instruction Types

- **Data Transfer:** MOV, MVI, LDA, STA, LHLD, SHLD
- **Arithmetic:** ADD, ADC, SUB, SBB, INR, DCR, DAD
- **Logical:** ANA, ORA, XRA, CMA, CPI, CMC
- **Branch:** JMP, JZ, JNZ, JC, JNC, CALL, RET
- **Control:** NOP, HLT, EI, DI, SIM, RIM

---

## Timing Diagram

The 8085 uses **machine cycles** consisting of multiple **T-states** (clock periods).

> [!FORMULA]
> **Execution time** = Number of T-states × Clock period $= \\frac{\\text{T-states}}{f_{clock}}$

A typical **LDA** instruction takes **13 T-states**. At 2 MHz clock: $t = 13 / (2 \\times 10^6) = 6.5\\,\\mu\\text{s}$

---

## Interrupts (8085)

Priority order (highest to lowest): **TRAP > RST 7.5 > RST 6.5 > RST 5.5 > INTR**

- TRAP: Non-maskable, highest priority
- RST 7.5/6.5/5.5: Maskable via SIM instruction

---

## Checkpoint

Write an 8085 assembly program to add two 8-bit numbers stored at memory addresses 2000H and 2001H, and store the result at 2002H.`;
  }

  if (isNetwork) {
    return `## Network Analysis — Socratic Session

> [!KEY]
> **Kirchhoff's Laws** are the foundation of all circuit analysis:
> - **KVL**: Sum of voltages around any closed loop = 0
> - **KCL**: Sum of currents at any node = 0

---

## Thevenin's Theorem

Any linear circuit can be replaced by a **single voltage source $V_{th}$** in series with a **resistance $R_{th}$**:

- $V_{th}$ = open-circuit voltage at the terminals
- $R_{th}$ = equivalent resistance seen from the terminals (with independent sources **zeroed**)

> [!FORMULA]
> Load current: $I_L = \\frac{V_{th}}{R_{th} + R_L}$

---

## Norton's Theorem

Dual of Thevenin — a **current source $I_N$** in parallel with $R_N$:

- $I_N$ = short-circuit current at the terminals
- $R_N = R_{th}$ (same equivalent resistance)

$$I_N = \\frac{V_{th}}{R_{th}}, \\quad V_{th} = I_N R_N$$

---

## Maximum Power Transfer

Maximum power is transferred to the load when:

$$R_L = R_{th}$$

$$P_{max} = \\frac{V_{th}^2}{4 R_{th}}$$

---

## Two-Port Network Parameters

| Parameters | Equations | Usage |
|-----------|-----------|-------|
| Z (impedance) | $V_1 = Z_{11}I_1 + Z_{12}I_2$ | Series connections |
| Y (admittance) | $I_1 = Y_{11}V_1 + Y_{12}V_2$ | Parallel connections |
| H (hybrid) | $V_1 = h_{11}I_1 + h_{12}V_2$ | **BJT small-signal model** |

---

## Checkpoint

Find the Thevenin equivalent of a circuit with a $10\\,\\text{V}$ source, $R_1 = 2\\,\\Omega$ in series, and $R_2 = 3\\,\\Omega$ in parallel with the load terminals.`;
  }

  if (isBJT) {
    return `## Bipolar Junction Transistor (BJT) — Socratic Session

> [!KEY]
> A BJT is a **current-controlled** device. The base current $I_B$ controls the collector current $I_C$. This is its fundamental distinction from MOSFETs (voltage-controlled).

---

## Active Region Bias Conditions (NPN)

- Emitter-Base junction: **Forward biased** → $V_{BE} \\approx 0.7\\,\\text{V}$
- Collector-Base junction: **Reverse biased** → $V_{CB} > 0$

> [!FORMULA]
> $$I_C = \\beta \\cdot I_B = \\alpha \\cdot I_E$$
> where $\\beta = h_{FE}$ (50–300 typically) and $\\alpha = \\frac{\\beta}{1+\\beta} < 1$

---

## KCL at the BJT

$$I_E = I_B + I_C = (1 + \\beta)\\, I_B$$

---

## Ebers-Moll Equation

$$I_C = I_S \\left(e^{V_{BE}/V_T} - 1\\right) \\approx I_S\\, e^{V_{BE}/V_T}$$

where $V_T = kT/q \\approx 26\\,\\text{mV}$ at 300 K.

**Each 60 mV increase in $V_{BE}$ increases $I_C$ by 10×.**

---

## Checkpoint

If $V_{BE}$ increases by $60\\,\\text{mV}$, by what factor does $I_C$ change? What does this imply about the **exponential sensitivity** of BJT to base voltage?`;
  }

  if (isMOSFET) {
    return `## MOSFET — Socratic Session

> [!KEY]
> A MOSFET is **voltage-controlled**. The gate voltage $V_{GS}$ modulates the channel conductance — no gate current flows in steady state (oxide insulation).

---

## Operating Regions

### Saturation ($V_{DS} \\geq V_{GS} - V_{th}$)
$$I_D = \\frac{\\mu_n C_{ox}}{2} \\cdot \\frac{W}{L} \\cdot (V_{GS} - V_{th})^2$$

### Triode ($V_{DS} < V_{GS} - V_{th}$)
$$I_D = \\mu_n C_{ox} \\frac{W}{L}\\left[(V_{GS} - V_{th})V_{DS} - \\frac{V_{DS}^2}{2}\\right]$$

---

> [!FORMULA]
> **Transconductance (saturation):** $g_m = \\mu_n C_{ox} \\frac{W}{L}(V_{GS}-V_{th}) = \\sqrt{2\\mu_n C_{ox}\\frac{W}{L}I_D} = \\frac{2I_D}{V_{OV}}$

---

## Checkpoint

A MOSFET has $\\mu_n C_{ox} = 200\\,\\mu\\text{A/V}^2$, $W/L = 20$, $V_{th} = 1\\,\\text{V}$, $V_{GS} = 2\\,\\text{V}$. Find $I_D$ and $g_m$ in saturation.`;
  }

  if (isDiode) {
    return `## p-n Junction Diode — Socratic Session

> [!KEY]
> The p-n junction is the **building block** of all semiconductor devices. At thermal equilibrium, diffusion current and drift current exactly balance — zero net current flows.

---

## Shockley Diode Equation

$$I = I_0\\left(e^{V/\\eta V_T} - 1\\right)$$

where $\\eta$ = 1 (diffusion) or 2 (recombination), $V_T = 26\\,\\text{mV}$ at 300 K.

> [!FORMULA]
> **Built-in potential:** $V_{bi} = V_T \\ln\\left(\\frac{N_A N_D}{n_i^2}\\right)$

---

## Checkpoint

A silicon diode ($I_0 = 1\\,\\text{nA}$, $\\eta = 1$) is forward-biased at $V = 0.6\\,\\text{V}$ at 300 K. Calculate the forward current $I$.`;
  }

  if (isOpAmp) {
    return `## Operational Amplifier — Socratic Session

> [!KEY]
> **Two Golden Rules** for ideal op-amp with negative feedback:
> 1. $v^+ = v^-$ (virtual short)
> 2. $i^+ = i^- = 0$ (virtual open — no input current)

---

## Key Configurations

> [!FORMULA]
> **Inverting:** $A_{CL} = -\\frac{R_f}{R_{in}}$
> **Non-Inverting:** $A_{CL} = 1 + \\frac{R_f}{R_1}$
> **Voltage Follower:** $A_{CL} = 1$, $Z_{in} \\to \\infty$, $Z_{out} \\to 0$

---

## Checkpoint

An inverting op-amp has $R_{in} = 10\\,\\text{k}\\Omega$, $R_f = 100\\,\\text{k}\\Omega$. Find the closed-loop gain and output voltage for $v_{in} = 0.5\\,\\text{V}$.`;
  }

  if (isSemiconductor) {
    return `## Semiconductor Physics — Socratic Session

> [!KEY]
> Silicon has band gap $E_g = 1.12\\,\\text{eV}$. At room temperature, $n_i \\approx 1.5 \\times 10^{10}\\,\\text{cm}^{-3}$. **Mass action law:** $n \\cdot p = n_i^2$ always holds in equilibrium.

---

## Carrier Concentrations

**n-type:** $n \\approx N_D$, $p = n_i^2/N_D$
**p-type:** $p \\approx N_A$, $n = n_i^2/N_A$

> [!FORMULA]
> **Fermi level (n-type):** $E_F - E_i = kT\\ln(N_D/n_i)$

---

## Checkpoint

Silicon doped with $N_D = 10^{17}\\,\\text{cm}^{-3}$. Find:
1. Electron concentration $n$
2. Hole concentration $p$
3. Position of Fermi level relative to intrinsic level $E_i$`;
  }

  if (isFET) {
    return `## JFET — Socratic Session

> [!KEY]
> The JFET is a **depletion-mode** voltage-controlled device. At $V_{GS} = 0$, maximum current $I_{DSS}$ flows. Channel is **pinched off** (zero current) at $V_{GS} = V_P$ (negative for n-channel).

> [!FORMULA]
> **Drain current:** $I_D = I_{DSS}\\left(1 - \\frac{V_{GS}}{V_P}\\right)^2$
> **Transconductance:** $g_m = g_{m0}\\left(1 - \\frac{V_{GS}}{V_P}\\right)$ where $g_{m0} = \\frac{-2I_{DSS}}{V_P}$

---

## Checkpoint

JFET with $I_{DSS} = 8\\,\\text{mA}$, $V_P = -4\\,\\text{V}$. Find $I_D$ and $g_m$ at $V_{GS} = -1\\,\\text{V}$.`;
  }

  // Graceful fallback — list all available topics
  return `## Topic Not Detected — Let Me Help You Navigate

> [!NOTE]
> I'm your **Socratic Tutor** covering the full **UGC NET Electronics & Communication** syllabus. I detected an unfamiliar phrasing — please try being more specific.

---

## Topics I Can Teach

### Devices & Circuits
- **BJT** — current gain, Ebers-Moll, h-parameters, amplifier configurations
- **MOSFET / FET** — transconductance, operating regions, small-signal model
- **Diodes** — Shockley equation, Zener, rectifiers, clipping/clamping
- **Op-Amps** — virtual ground, inverting/non-inverting, integrators

### Fundamentals
- **Semiconductor Physics** — band theory, doping, Fermi level, carriers
- **Network Analysis** — Thevenin, Norton, KVL/KCL, two-port parameters

### Systems & Communication
- **Signals & Systems** — Fourier, Laplace, Z-transform, convolution, LTI
- **Control Systems** — Bode plot, Routh-Hurwitz, root locus, PID
- **Communication** — AM, FM, PCM, Shannon capacity, modulation schemes
- **Optical Fiber** — TIR, numerical aperture, fiber types, dispersion

### Digital & Hardware
- **Digital Electronics** — Boolean algebra, K-maps, flip-flops, counters
- **Microprocessors** — 8085 architecture, instruction set, interrupts, timing
- **Electromagnetic Theory** — Maxwell's equations, wave propagation, waveguides

---

**Just type your question naturally** — e.g., *"Explain BJT current gain"*, *"What is numerical aperture in optical fiber?"*, *"Derive the Shannon capacity formula"*`;
}
