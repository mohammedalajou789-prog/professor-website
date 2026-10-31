/**
 * Python prelude for ```pyplot figures — runs once inside Pyodide (browser, Web Worker).
 * Gives every figure: np, plt, math, mp (mpmath), gamma, ml (Mittag-Leffler),
 * caputo (L1 scheme), fde_solve (Caputo predictor–corrector), and the sheet's visual style.
 * Bump PY_STYLE_VERSION (src/lib/mn/parse.ts) when the look changes → every figure regenerates.
 */
export const PY_PRELUDE = String.raw`
import os, io, math, traceback
os.environ['MPLBACKEND'] = 'AGG'
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import mpmath as mp
from cycler import cycler

MN_COLORS = ['#0B6FA4', '#C0392B', '#0E7C6B', '#D35400', '#7D3C98', '#8E5B3A', '#12A4D9', '#4F6272']
blue, red, green, orange, purple, brown, sky, gray = MN_COLORS
gold, navy = '#C9A227', '#12233C'

def __mn_style():
    matplotlib.rcdefaults()
    plt.rcParams.update({
        'figure.figsize': (6.4, 3.8), 'figure.dpi': 100,
        'font.family': 'STIXGeneral', 'mathtext.fontset': 'stix', 'font.size': 11.5,
        'axes.prop_cycle': cycler(color=MN_COLORS),
        'axes.edgecolor': '#4F6272', 'axes.labelcolor': '#1A1A1A', 'axes.linewidth': 0.8,
        'axes.spines.top': False, 'axes.spines.right': False,
        'axes.grid': True, 'grid.color': '#DCE6EE', 'grid.linewidth': 0.6,
        'axes.titlesize': 12.5, 'axes.titlecolor': '#0B6FA4', 'axes.titleweight': 'bold',
        'axes.formatter.use_mathtext': True, 'axes.unicode_minus': True,
        'xtick.color': '#4F6272', 'ytick.color': '#4F6272', 'xtick.labelcolor': '#1A1A1A', 'ytick.labelcolor': '#1A1A1A',
        'lines.linewidth': 1.8, 'lines.markersize': 5,
        'legend.frameon': False, 'legend.fontsize': 10.5,
        'savefig.transparent': True, 'savefig.dpi': 170, 'svg.fonttype': 'path', 'svg.hashsalt': 'mn',
        'image.cmap': 'viridis',
    })

# ---------------------------------------------------------------- special functions

def _vec(f):
    def g(x, *a, **k):
        if np.ndim(x) == 0:
            return f(x, *a, **k)
        arr = np.asarray(x)
        out = [f(v, *a, **k) for v in arr.ravel()]
        dt = complex if any(isinstance(v, complex) for v in out) else float
        return np.array(out, dtype=dt).reshape(arr.shape)
    g.__doc__ = f.__doc__
    return g

def _gamma1(x):
    try:
        return math.gamma(float(x))
    except (ValueError, OverflowError):
        return math.inf

gamma = _vec(_gamma1)

def _ml1(z, alpha, beta=1.0):
    """Mittag-Leffler E_{alpha,beta}(z) (series with adaptive precision; asymptotic expansion for large negative z)."""
    a, b = float(alpha), float(beta)
    if a <= 0:
        raise ValueError('ml: alpha must be > 0')
    iscomplex = isinstance(z, complex) or np.iscomplexobj(z)
    z = complex(z) if iscomplex else float(z)
    if z == 0:
        return float(mp.rgamma(b))
    r = abs(z)
    scale = r ** (1.0 / a)
    if (not iscomplex) and z < 0 and a < 2 and scale > 250:
        s, prev = 0.0, math.inf
        for k in range(1, 60):
            t = -(z ** (-k)) * float(mp.rgamma(b - a * k))
            if abs(t) > prev and k > 2:
                break
            s += t
            prev = abs(t) if t != 0 else prev
        return s
    dps = min(20 + int(scale / 2.2), 900)
    with mp.workdps(dps):
        zz = mp.mpc(z) if iscomplex else mp.mpf(z)
        s = mp.mpf(0)
        k = 0
        tiny = mp.mpf(10) ** (-dps + 5)
        while k < 20000:
            t = zz ** k * mp.rgamma(a * k + b)
            s += t
            if k > scale + 5 and abs(t) <= tiny * (abs(s) + tiny):
                break
            k += 1
        return complex(s) if iscomplex else float(s)

ml = _vec(_ml1)
mittag_leffler = ml

# ---------------------------------------------------------------- fractional calculus

def caputo(y, t, alpha):
    """Caputo derivative of order 0<alpha<1 on a uniform grid t (L1 scheme). y: array or callable."""
    t = np.asarray(t, dtype=float)
    yv = np.asarray(y(t) if callable(y) else y, dtype=float)
    if not (0 < alpha < 1):
        raise ValueError('caputo: 0 < alpha < 1')
    h = t[1] - t[0]
    n = len(t)
    k = np.arange(n)
    b = (k + 1) ** (1 - alpha) - k ** (1 - alpha)
    dy = np.diff(yv)
    out = np.zeros(n)
    for i in range(1, n):
        out[i] = np.dot(b[:i], dy[i - 1::-1])
    return out * h ** (-alpha) / math.gamma(2 - alpha)

def fde_solve(f, y0, alpha, t_end, h=0.01):
    """Solve the Caputo FDE  D^alpha y = f(t, y),  y(0) = y0,  0 < alpha <= 1  (Diethelm predictor–corrector).
    y0 may be a number or a list (system). Returns (t, y); for systems y has shape (len(t), m)."""
    if not (0 < alpha <= 1):
        raise ValueError('fde_solve: 0 < alpha <= 1')
    N = int(round(t_end / h))
    t = np.linspace(0, N * h, N + 1)
    y0a = np.atleast_1d(np.asarray(y0, dtype=float))
    m = y0a.size
    y = np.zeros((N + 1, m)); y[0] = y0a
    F = np.zeros((N + 1, m))
    def fv(tt, yy):
        v = f(tt, yy if m > 1 else yy[0])
        return np.atleast_1d(np.asarray(v, dtype=float))
    F[0] = fv(t[0], y[0])
    c1 = h ** alpha / math.gamma(alpha + 1)
    c2 = h ** alpha / math.gamma(alpha + 2)
    for n in range(N):
        j = np.arange(n + 1)
        bj = (n + 1 - j) ** alpha - (n - j) ** alpha
        yp = y0a + c1 * (bj @ F[: n + 1])
        aj = (n - j + 2.0) ** (alpha + 1) + (n - j + 0.0) ** (alpha + 1) - 2 * (n - j + 1.0) ** (alpha + 1)
        aj[0] = n ** (alpha + 1) - (n - alpha) * (n + 1) ** alpha
        y[n + 1] = y0a + c2 * (fv(t[n + 1], yp) + aj @ F[: n + 1])
        F[n + 1] = fv(t[n + 1], y[n + 1])
    return t, (y if m > 1 else y[:, 0])

# ---------------------------------------------------------------- helpers for typical sheet figures

def axes_through_origin(ax=None):
    """Draw the x/y axes through the origin (school style)."""
    ax = ax or plt.gca()
    ax.spines['left'].set_position('zero'); ax.spines['bottom'].set_position('zero')
    ax.spines['top'].set_visible(False); ax.spines['right'].set_visible(False)
    ax.plot(1, 0, '>', color='#4F6272', transform=ax.get_yaxis_transform(), clip_on=False, ms=4)
    ax.plot(0, 1, '^', color='#4F6272', transform=ax.get_xaxis_transform(), clip_on=False, ms=4)
    return ax

def pi_ticks(ax=None, axis='x', step=0.5):
    """Label an axis in multiples of pi (step in units of pi)."""
    from matplotlib.ticker import FuncFormatter, MultipleLocator
    from fractions import Fraction
    ax = ax or plt.gca()
    def fmt(v, _):
        fr = Fraction(v / math.pi).limit_denominator(12)
        if fr == 0: return '$0$'
        sign = '-' if fr < 0 else ''
        n, d = abs(fr.numerator), fr.denominator
        top = r'\pi' if n == 1 else f'{n}' + r'\pi'
        return ('$' + sign + top + '$') if d == 1 else ('$' + sign + r'\frac{' + top + '}{' + str(d) + '}$')
    target = ax.xaxis if axis == 'x' else ax.yaxis
    target.set_major_locator(MultipleLocator(step * math.pi))
    target.set_major_formatter(FuncFormatter(fmt))
    return ax

__mn_names = set(globals().keys())

def __mn_run(code):
    __mn_style()
    plt.close('all')
    plt.show = lambda *a, **k: None
    ns = {k: v for k, v in globals().items() if not k.startswith('_')}
    ns['__name__'] = '__figure__'
    try:
        exec(compile(code, '<figure>', 'exec'), ns)
    except BaseException as e:
        tb = traceback.extract_tb(e.__traceback__)
        src = code.splitlines()
        lines = [f'line {fr.lineno}: {src[fr.lineno - 1].strip() if 0 < fr.lineno <= len(src) else ""}' for fr in tb if fr.filename == '<figure>']
        if not lines and isinstance(e, SyntaxError) and e.lineno:
            lines = [f'line {e.lineno}: {(e.text or "").strip()}']
        where = (lines[-1] + '\n') if lines else ''
        raise RuntimeError(f'{where}{type(e).__name__}: {e}') from None
    nums = plt.get_fignums()
    if not nums:
        raise RuntimeError('The code did not draw anything. Use plt.plot(...), plt.subplots(...) etc.')
    fig = plt.figure(nums[-1])
    # filled contours / images / heat maps: no grid lines on top
    from matplotlib.image import AxesImage
    from matplotlib.collections import QuadMesh
    for ax in fig.axes:
        if ax.images or any(isinstance(c, QuadMesh) or (hasattr(c, 'filled') and c.filled) for c in ax.collections):
            ax.grid(False)
    # very dense artists (surfaces, huge scatters) → embedded bitmap, text and axes stay vector
    from matplotlib.collections import Collection
    try:
        fig.canvas.draw()
    except Exception:
        pass
    for c in fig.findobj(Collection):
        try:
            paths = c.get_paths()
            verts = sum(len(p.vertices) for p in paths)
            if len(paths) > 800 or verts > 40000 or len(c.get_offsets()) > 4000:
                c.set_rasterized(True)
        except Exception:
            pass
    buf = io.StringIO()
    fig.savefig(buf, format='svg', bbox_inches='tight', pad_inches=0.05, metadata={'Date': None, 'Creator': None})
    plt.close('all')
    return buf.getvalue()

__mn_style()
`
