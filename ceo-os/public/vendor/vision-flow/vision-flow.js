function Kv(l) {
  return l && l.__esModule && Object.prototype.hasOwnProperty.call(l, "default") ? l.default : l;
}
var rd = { exports: {} }, Et = {};
var _y;
function Mb() {
  if (_y) return Et;
  _y = 1;
  var l = /* @__PURE__ */ Symbol.for("react.transitional.element"), i = /* @__PURE__ */ Symbol.for("react.portal"), o = /* @__PURE__ */ Symbol.for("react.fragment"), r = /* @__PURE__ */ Symbol.for("react.strict_mode"), s = /* @__PURE__ */ Symbol.for("react.profiler"), f = /* @__PURE__ */ Symbol.for("react.consumer"), d = /* @__PURE__ */ Symbol.for("react.context"), g = /* @__PURE__ */ Symbol.for("react.forward_ref"), S = /* @__PURE__ */ Symbol.for("react.suspense"), v = /* @__PURE__ */ Symbol.for("react.memo"), y = /* @__PURE__ */ Symbol.for("react.lazy"), m = /* @__PURE__ */ Symbol.for("react.activity"), p = /* @__PURE__ */ Symbol.for("react.view_transition"), b = Symbol.iterator;
  function E(T) {
    return T === null || typeof T != "object" ? null : (T = b && T[b] || T["@@iterator"], typeof T == "function" ? T : null);
  }
  var C = {
    isMounted: function() {
      return !1;
    },
    enqueueForceUpdate: function() {
    },
    enqueueReplaceState: function() {
    },
    enqueueSetState: function() {
    }
  }, N = Object.assign, w = {};
  function U(T, k, st) {
    this.props = T, this.context = k, this.refs = w, this.updater = st || C;
  }
  U.prototype.isReactComponent = {}, U.prototype.setState = function(T, k) {
    if (typeof T != "object" && typeof T != "function" && T != null)
      throw Error(
        "takes an object of state variables to update or a function which returns an object of state variables."
      );
    this.updater.enqueueSetState(this, T, k, "setState");
  }, U.prototype.forceUpdate = function(T) {
    this.updater.enqueueForceUpdate(this, T, "forceUpdate");
  };
  function _() {
  }
  _.prototype = U.prototype;
  function A(T, k, st) {
    this.props = T, this.context = k, this.refs = w, this.updater = st || C;
  }
  var j = A.prototype = new _();
  j.constructor = A, N(j, U.prototype), j.isPureReactComponent = !0;
  var B = Array.isArray;
  function R() {
  }
  var Z = { H: null, A: null, T: null, S: null }, J = Object.prototype.hasOwnProperty;
  function it(T, k, st) {
    var ut = st.ref;
    return {
      $$typeof: l,
      type: T,
      key: k,
      ref: ut !== void 0 ? ut : null,
      props: st
    };
  }
  function tt(T, k) {
    return it(T.type, k, T.props);
  }
  function ot(T) {
    return typeof T == "object" && T !== null && T.$$typeof === l;
  }
  function lt(T) {
    var k = { "=": "=0", ":": "=2" };
    return "$" + T.replace(/[=:]/g, function(st) {
      return k[st];
    });
  }
  var M = /\/+/g;
  function V(T, k) {
    return typeof T == "object" && T !== null && T.key != null ? lt("" + T.key) : k.toString(36);
  }
  function O(T) {
    switch (T.status) {
      case "fulfilled":
        return T.value;
      case "rejected":
        throw T.reason;
      default:
        switch (typeof T.status == "string" ? T.then(R, R) : (T.status = "pending", T.then(
          function(k) {
            T.status === "pending" && (T.status = "fulfilled", T.value = k);
          },
          function(k) {
            T.status === "pending" && (T.status = "rejected", T.reason = k);
          }
        )), T.status) {
          case "fulfilled":
            return T.value;
          case "rejected":
            throw T.reason;
        }
    }
    throw T;
  }
  function H(T, k, st, ut, I) {
    var ft = typeof T;
    (ft === "undefined" || ft === "boolean") && (T = null);
    var gt = !1;
    if (T === null) gt = !0;
    else
      switch (ft) {
        case "bigint":
        case "string":
        case "number":
          gt = !0;
          break;
        case "object":
          switch (T.$$typeof) {
            case l:
            case i:
              gt = !0;
              break;
            case y:
              return gt = T._init, H(
                gt(T._payload),
                k,
                st,
                ut,
                I
              );
          }
      }
    if (gt)
      return I = I(T), gt = ut === "" ? "." + V(T, 0) : ut, B(I) ? (st = "", gt != null && (st = gt.replace(M, "$&/") + "/"), H(I, k, st, "", function(vt) {
        return vt;
      })) : I != null && (ot(I) && (I = tt(
        I,
        st + (I.key == null || T && T.key === I.key ? "" : ("" + I.key).replace(
          M,
          "$&/"
        ) + "/") + gt
      )), k.push(I)), 1;
    gt = 0;
    var ct = ut === "" ? "." : ut + ":";
    if (B(T))
      for (var rt = 0; rt < T.length; rt++)
        ut = T[rt], ft = ct + V(ut, rt), gt += H(
          ut,
          k,
          st,
          ft,
          I
        );
    else if (rt = E(T), typeof rt == "function")
      for (T = rt.call(T), rt = 0; !(ut = T.next()).done; )
        ut = ut.value, ft = ct + V(ut, rt++), gt += H(
          ut,
          k,
          st,
          ft,
          I
        );
    else if (ft === "object") {
      if (typeof T.then == "function")
        return H(
          O(T),
          k,
          st,
          ut,
          I
        );
      throw k = String(T), Error(
        "Objects are not valid as a React child (found: " + (k === "[object Object]" ? "object with keys {" + Object.keys(T).join(", ") + "}" : k) + "). If you meant to render a collection of children, use an array instead."
      );
    }
    return gt;
  }
  function X(T, k, st) {
    if (T == null) return T;
    var ut = [], I = 0;
    return H(T, ut, "", "", function(ft) {
      return k.call(st, ft, I++);
    }), ut;
  }
  function K(T) {
    if (T._status === -1) {
      var k = T._result, st = k();
      st.then(
        function(ut) {
          (T._status === 0 || T._status === -1) && (T._status = 1, T._result = ut, st.status === void 0 && (st.status = "fulfilled", st.value = ut));
        },
        function(ut) {
          (T._status === 0 || T._status === -1) && (T._status = 2, T._result = ut, st.status === void 0 && (st.status = "rejected", st.reason = ut));
        }
      ), T._status === -1 && (T._status = 0, T._result = st);
    }
    if (T._status === 1) return T._result.default;
    throw T._result;
  }
  var F = typeof reportError == "function" ? reportError : function(T) {
    if (typeof window == "object" && typeof window.ErrorEvent == "function") {
      var k = new window.ErrorEvent("error", {
        bubbles: !0,
        cancelable: !0,
        message: typeof T == "object" && T !== null && typeof T.message == "string" ? String(T.message) : String(T),
        error: T
      });
      if (!window.dispatchEvent(k)) return;
    } else if (typeof process == "object" && typeof process.emit == "function") {
      process.emit("uncaughtException", T);
      return;
    }
    console.error(T);
  };
  function at(T) {
    var k = Z.T, st = {};
    st.types = k !== null ? k.types : null, Z.T = st;
    try {
      var ut = T(), I = Z.S;
      I !== null && I(st, ut), typeof ut == "object" && ut !== null && typeof ut.then == "function" && ut.then(R, F);
    } catch (ft) {
      F(ft);
    } finally {
      k !== null && st.types !== null && (k.types = st.types), Z.T = k;
    }
  }
  function dt(T) {
    var k = Z.T;
    if (k !== null) {
      var st = k.types;
      st === null ? k.types = [T] : st.indexOf(T) === -1 && st.push(T);
    } else at(dt.bind(null, T));
  }
  var pt = {
    map: X,
    forEach: function(T, k, st) {
      X(
        T,
        function() {
          k.apply(this, arguments);
        },
        st
      );
    },
    count: function(T) {
      var k = 0;
      return X(T, function() {
        k++;
      }), k;
    },
    toArray: function(T) {
      return X(T, function(k) {
        return k;
      }) || [];
    },
    only: function(T) {
      if (!ot(T))
        throw Error(
          "React.Children.only expected to receive a single React element child."
        );
      return T;
    }
  };
  return Et.Activity = m, Et.Children = pt, Et.Component = U, Et.Fragment = o, Et.Profiler = s, Et.PureComponent = A, Et.StrictMode = r, Et.Suspense = S, Et.ViewTransition = p, Et.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = Z, Et.__COMPILER_RUNTIME = {
    __proto__: null,
    c: function(T) {
      return Z.H.useMemoCache(T);
    }
  }, Et.addTransitionType = dt, Et.cache = function(T) {
    return function() {
      return T.apply(null, arguments);
    };
  }, Et.cacheSignal = function() {
    return null;
  }, Et.cloneElement = function(T, k, st) {
    if (T == null)
      throw Error(
        "The argument must be a React element, but you passed " + T + "."
      );
    var ut = N({}, T.props), I = T.key;
    if (k != null)
      for (ft in k.key !== void 0 && (I = "" + k.key), k)
        !J.call(k, ft) || ft === "key" || ft === "__self" || ft === "__source" || ft === "ref" && k.ref === void 0 || (ut[ft] = k[ft]);
    var ft = arguments.length - 2;
    if (ft === 1) ut.children = st;
    else if (1 < ft) {
      for (var gt = Array(ft), ct = 0; ct < ft; ct++)
        gt[ct] = arguments[ct + 2];
      ut.children = gt;
    }
    return it(T.type, I, ut);
  }, Et.createContext = function(T) {
    return T = {
      $$typeof: d,
      _currentValue: T,
      _currentValue2: T,
      _threadCount: 0,
      Provider: null,
      Consumer: null
    }, T.Provider = T, T.Consumer = {
      $$typeof: f,
      _context: T
    }, T;
  }, Et.createElement = function(T, k, st) {
    var ut, I = {}, ft = null;
    if (k != null)
      for (ut in k.key !== void 0 && (ft = "" + k.key), k)
        J.call(k, ut) && ut !== "key" && ut !== "__self" && ut !== "__source" && (I[ut] = k[ut]);
    var gt = arguments.length - 2;
    if (gt === 1) I.children = st;
    else if (1 < gt) {
      for (var ct = Array(gt), rt = 0; rt < gt; rt++)
        ct[rt] = arguments[rt + 2];
      I.children = ct;
    }
    if (T && T.defaultProps)
      for (ut in gt = T.defaultProps, gt)
        I[ut] === void 0 && (I[ut] = gt[ut]);
    return it(T, ft, I);
  }, Et.createRef = function() {
    return { current: null };
  }, Et.forwardRef = function(T) {
    return { $$typeof: g, render: T };
  }, Et.isValidElement = ot, Et.lazy = function(T) {
    return {
      $$typeof: y,
      _payload: { _status: -1, _result: T },
      _init: K
    };
  }, Et.memo = function(T, k) {
    return {
      $$typeof: v,
      type: T,
      compare: k === void 0 ? null : k
    };
  }, Et.startTransition = at, Et.unstable_useCacheRefresh = function() {
    return Z.H.useCacheRefresh();
  }, Et.use = function(T) {
    return Z.H.use(T);
  }, Et.useActionState = function(T, k, st) {
    return Z.H.useActionState(T, k, st);
  }, Et.useCallback = function(T, k) {
    return Z.H.useCallback(T, k);
  }, Et.useContext = function(T) {
    return Z.H.useContext(T);
  }, Et.useDebugValue = function() {
  }, Et.useDeferredValue = function(T, k) {
    return Z.H.useDeferredValue(T, k);
  }, Et.useEffect = function(T, k) {
    return Z.H.useEffect(T, k);
  }, Et.useEffectEvent = function(T) {
    return Z.H.useEffectEvent(T);
  }, Et.useId = function() {
    return Z.H.useId();
  }, Et.useImperativeHandle = function(T, k, st) {
    return Z.H.useImperativeHandle(T, k, st);
  }, Et.useInsertionEffect = function(T, k) {
    return Z.H.useInsertionEffect(T, k);
  }, Et.useLayoutEffect = function(T, k) {
    return Z.H.useLayoutEffect(T, k);
  }, Et.useMemo = function(T, k) {
    return Z.H.useMemo(T, k);
  }, Et.useOptimistic = function(T, k) {
    return Z.H.useOptimistic(T, k);
  }, Et.useReducer = function(T, k, st) {
    return Z.H.useReducer(T, k, st);
  }, Et.useRef = function(T) {
    return Z.H.useRef(T);
  }, Et.useState = function(T) {
    return Z.H.useState(T);
  }, Et.useSyncExternalStore = function(T, k, st) {
    return Z.H.useSyncExternalStore(
      T,
      k,
      st
    );
  }, Et.useTransition = function() {
    return Z.H.useTransition();
  }, Et.version = "19.3.1", Et;
}
var wy;
function Iu() {
  return wy || (wy = 1, rd.exports = Mb()), rd.exports;
}
var P = Iu();
const Si = /* @__PURE__ */ Kv(P);
var sd = { exports: {} }, Du = {}, fd = { exports: {} }, dd = {};
var Ny;
function zb() {
  return Ny || (Ny = 1, (function(l) {
    function i(O, H) {
      var X = O.length;
      O.push(H);
      t: for (; 0 < X; ) {
        var K = X - 1 >>> 1, F = O[K];
        if (0 < s(F, H))
          O[K] = H, O[X] = F, X = K;
        else break t;
      }
    }
    function o(O) {
      return O.length === 0 ? null : O[0];
    }
    function r(O) {
      if (O.length === 0) return null;
      var H = O[0], X = O.pop();
      if (X !== H) {
        O[0] = X;
        t: for (var K = 0, F = O.length, at = F >>> 1; K < at; ) {
          var dt = 2 * (K + 1) - 1, pt = O[dt], T = dt + 1, k = O[T];
          if (0 > s(pt, X))
            T < F && 0 > s(k, pt) ? (O[K] = k, O[T] = X, K = T) : (O[K] = pt, O[dt] = X, K = dt);
          else if (T < F && 0 > s(k, X))
            O[K] = k, O[T] = X, K = T;
          else break t;
        }
      }
      return H;
    }
    function s(O, H) {
      var X = O.sortIndex - H.sortIndex;
      return X !== 0 ? X : O.id - H.id;
    }
    if (l.unstable_now = void 0, typeof performance == "object" && typeof performance.now == "function") {
      var f = performance;
      l.unstable_now = function() {
        return f.now();
      };
    } else {
      var d = Date, g = d.now();
      l.unstable_now = function() {
        return d.now() - g;
      };
    }
    var S = [], v = [], y = 1, m = null, p = 3, b = !1, E = !1, C = !1, N = !1, w = typeof setTimeout == "function" ? setTimeout : null, U = typeof clearTimeout == "function" ? clearTimeout : null, _ = typeof setImmediate < "u" ? setImmediate : null;
    function A(O) {
      for (var H = o(v); H !== null; ) {
        if (H.callback === null) r(v);
        else if (H.startTime <= O)
          r(v), H.sortIndex = H.expirationTime, i(S, H);
        else break;
        H = o(v);
      }
    }
    function j(O) {
      if (C = !1, A(O), !E)
        if (o(S) !== null)
          E = !0, B || (B = !0, ot());
        else {
          var H = o(v);
          H !== null && V(j, H.startTime - O);
        }
    }
    var B = !1, R = -1, Z = 5, J = -1;
    function it() {
      return N ? !0 : !(l.unstable_now() - J < Z);
    }
    function tt() {
      if (N = !1, B) {
        var O = l.unstable_now();
        J = O;
        var H = !0;
        try {
          t: {
            E = !1, C && (C = !1, U(R), R = -1), b = !0;
            var X = p;
            try {
              e: {
                for (A(O), m = o(S); m !== null && !(m.expirationTime > O && it()); ) {
                  var K = m.callback;
                  if (typeof K == "function") {
                    m.callback = null, p = m.priorityLevel;
                    var F = K(
                      m.expirationTime <= O
                    );
                    if (O = l.unstable_now(), typeof F == "function") {
                      m.callback = F, A(O), H = !0;
                      break e;
                    }
                    m === o(S) && r(S), A(O);
                  } else r(S);
                  m = o(S);
                }
                if (m !== null) H = !0;
                else {
                  var at = o(v);
                  at !== null && V(
                    j,
                    at.startTime - O
                  ), H = !1;
                }
              }
              break t;
            } finally {
              m = null, p = X, b = !1;
            }
            H = void 0;
          }
        } finally {
          H ? ot() : B = !1;
        }
      }
    }
    var ot;
    if (typeof _ == "function")
      ot = function() {
        _(tt);
      };
    else if (typeof MessageChannel < "u") {
      var lt = new MessageChannel(), M = lt.port2;
      lt.port1.onmessage = tt, ot = function() {
        M.postMessage(null);
      };
    } else
      ot = function() {
        w(tt, 0);
      };
    function V(O, H) {
      R = w(function() {
        O(l.unstable_now());
      }, H);
    }
    l.unstable_IdlePriority = 5, l.unstable_ImmediatePriority = 1, l.unstable_LowPriority = 4, l.unstable_NormalPriority = 3, l.unstable_Profiling = null, l.unstable_UserBlockingPriority = 2, l.unstable_cancelCallback = function(O) {
      O.callback = null;
    }, l.unstable_forceFrameRate = function(O) {
      0 > O || 125 < O ? console.error(
        "forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"
      ) : Z = 0 < O ? Math.floor(1e3 / O) : 5;
    }, l.unstable_getCurrentPriorityLevel = function() {
      return p;
    }, l.unstable_next = function(O) {
      switch (p) {
        case 1:
        case 2:
        case 3:
          var H = 3;
          break;
        default:
          H = p;
      }
      var X = p;
      p = H;
      try {
        return O();
      } finally {
        p = X;
      }
    }, l.unstable_requestPaint = function() {
      N = !0;
    }, l.unstable_runWithPriority = function(O, H) {
      switch (O) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
          break;
        default:
          O = 3;
      }
      var X = p;
      p = O;
      try {
        return H();
      } finally {
        p = X;
      }
    }, l.unstable_scheduleCallback = function(O, H, X) {
      var K = l.unstable_now();
      switch (typeof X == "object" && X !== null ? (X = X.delay, X = typeof X == "number" && 0 < X ? K + X : K) : X = K, O) {
        case 1:
          var F = -1;
          break;
        case 2:
          F = 250;
          break;
        case 5:
          F = 1073741823;
          break;
        case 4:
          F = 1e4;
          break;
        default:
          F = 5e3;
      }
      return F = X + F, O = {
        id: y++,
        callback: H,
        priorityLevel: O,
        startTime: X,
        expirationTime: F,
        sortIndex: -1
      }, X > K ? (O.sortIndex = X, i(v, O), o(S) === null && O === o(v) && (C ? (U(R), R = -1) : C = !0, V(j, X - K))) : (O.sortIndex = F, i(S, O), E || b || (E = !0, B || (B = !0, ot()))), O;
    }, l.unstable_shouldYield = it, l.unstable_wrapCallback = function(O) {
      var H = p;
      return function() {
        var X = p;
        p = H;
        try {
          return O.apply(this, arguments);
        } finally {
          p = X;
        }
      };
    };
  })(dd)), dd;
}
var Ty;
function Cb() {
  return Ty || (Ty = 1, fd.exports = zb()), fd.exports;
}
var hd = { exports: {} }, Se = {};
var My;
function Ab() {
  if (My) return Se;
  My = 1;
  var l = Iu();
  function i(y) {
    var m = "https://react.dev/errors/" + y;
    if (1 < arguments.length) {
      m += "?args[]=" + encodeURIComponent(arguments[1]);
      for (var p = 2; p < arguments.length; p++)
        m += "&args[]=" + encodeURIComponent(arguments[p]);
    }
    return "Minified React error #" + y + "; visit " + m + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  function o() {
  }
  var r = {
    d: {
      f: o,
      r: function() {
        throw Error(i(522));
      },
      D: o,
      C: o,
      L: o,
      m: o,
      X: o,
      S: o,
      M: o
    },
    p: 0,
    findDOMNode: null
  }, s = /* @__PURE__ */ Symbol.for("react.portal"), f = /* @__PURE__ */ Symbol.for("react.recoverable"), d = /* @__PURE__ */ Symbol.for("react.optimistic_key");
  function g(y, m, p) {
    var b = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return {
      $$typeof: s,
      key: b == null ? null : b === d ? d : "" + b,
      children: y,
      containerInfo: m,
      implementation: p
    };
  }
  var S = l.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  function v(y, m) {
    if (y === "font") return "";
    if (typeof m == "string")
      return m === "use-credentials" ? m : "";
  }
  return Se.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = r, Se.browser = function(y) {
    return { $$typeof: f, _reason: y };
  }, Se.createPortal = function(y, m) {
    var p = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
    if (!m || m.nodeType !== 1 && m.nodeType !== 9 && m.nodeType !== 11)
      throw Error(i(299));
    return g(y, m, null, p);
  }, Se.flushSync = function(y) {
    var m = S.T, p = r.p;
    try {
      if (S.T = null, r.p = 2, y) return y();
    } finally {
      S.T = m, r.p = p, r.d.f();
    }
  }, Se.preconnect = function(y, m) {
    typeof y == "string" && (m ? (m = m.crossOrigin, m = typeof m == "string" ? m === "use-credentials" ? m : "" : void 0) : m = null, r.d.C(y, m));
  }, Se.prefetchDNS = function(y) {
    typeof y == "string" && r.d.D(y);
  }, Se.preinit = function(y, m) {
    if (typeof y == "string" && m && typeof m.as == "string") {
      var p = m.as, b = v(p, m.crossOrigin), E = typeof m.integrity == "string" ? m.integrity : void 0, C = typeof m.fetchPriority == "string" ? m.fetchPriority : void 0;
      p === "style" ? r.d.S(
        y,
        typeof m.precedence == "string" ? m.precedence : void 0,
        {
          crossOrigin: b,
          integrity: E,
          fetchPriority: C
        }
      ) : p === "script" && r.d.X(y, {
        crossOrigin: b,
        integrity: E,
        fetchPriority: C,
        nonce: typeof m.nonce == "string" ? m.nonce : void 0
      });
    }
  }, Se.preinitModule = function(y, m) {
    if (typeof y == "string")
      if (typeof m == "object" && m !== null) {
        if (m.as == null || m.as === "script") {
          var p = v(
            m.as,
            m.crossOrigin
          );
          r.d.M(y, {
            crossOrigin: p,
            integrity: typeof m.integrity == "string" ? m.integrity : void 0,
            nonce: typeof m.nonce == "string" ? m.nonce : void 0,
            fetchPriority: typeof m.fetchPriority == "string" ? m.fetchPriority : void 0
          });
        }
      } else m == null && r.d.M(y);
  }, Se.preload = function(y, m) {
    if (typeof y == "string" && typeof m == "object" && m !== null && typeof m.as == "string") {
      var p = m.as, b = v(p, m.crossOrigin);
      r.d.L(y, p, {
        crossOrigin: b,
        integrity: typeof m.integrity == "string" ? m.integrity : void 0,
        nonce: typeof m.nonce == "string" ? m.nonce : void 0,
        type: typeof m.type == "string" ? m.type : void 0,
        fetchPriority: typeof m.fetchPriority == "string" ? m.fetchPriority : void 0,
        referrerPolicy: typeof m.referrerPolicy == "string" ? m.referrerPolicy : void 0,
        imageSrcSet: typeof m.imageSrcSet == "string" ? m.imageSrcSet : void 0,
        imageSizes: typeof m.imageSizes == "string" ? m.imageSizes : void 0,
        media: typeof m.media == "string" ? m.media : void 0
      });
    }
  }, Se.preloadModule = function(y, m) {
    if (typeof y == "string")
      if (m) {
        var p = v(m.as, m.crossOrigin);
        r.d.m(y, {
          as: typeof m.as == "string" && m.as !== "script" ? m.as : void 0,
          crossOrigin: p,
          integrity: typeof m.integrity == "string" ? m.integrity : void 0,
          nonce: typeof m.nonce == "string" ? m.nonce : void 0,
          fetchPriority: typeof m.fetchPriority == "string" ? m.fetchPriority : void 0
        });
      } else r.d.m(y);
  }, Se.requestFormReset = function(y) {
    r.d.r(y);
  }, Se.unstable_batchedUpdates = function(y, m) {
    return y(m);
  }, Se.useFormState = function(y, m, p) {
    return S.H.useFormState(y, m, p);
  }, Se.useFormStatus = function() {
    return S.H.useHostTransitionStatus();
  }, Se.version = "19.3.1", Se;
}
var zy;
function $v() {
  if (zy) return hd.exports;
  zy = 1;
  function l() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(l);
      } catch (i) {
        console.error(i);
      }
  }
  return l(), hd.exports = Ab(), hd.exports;
}
var Cy;
function Ob() {
  if (Cy) return Du;
  Cy = 1;
  var l = Cb(), i = Iu(), o = $v();
  function r(t) {
    var e = "https://react.dev/errors/" + t;
    if (1 < arguments.length) {
      e += "?args[]=" + encodeURIComponent(arguments[1]);
      for (var n = 2; n < arguments.length; n++)
        e += "&args[]=" + encodeURIComponent(arguments[n]);
    }
    return "Minified React error #" + t + "; visit " + e + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  function s(t) {
    return !(!t || t.nodeType !== 1 && t.nodeType !== 9 && t.nodeType !== 11);
  }
  function f(t) {
    for (var e = t, n = e; n && !n.alternate; )
      e = n, (e.flags & 4098) !== 0 && (t = e.return), n = e.return;
    for (; e.return; ) e = e.return;
    return e.tag === 3 ? t : null;
  }
  function d(t) {
    if (t.tag === 13) {
      var e = t.memoizedState;
      if (e === null && (t = t.alternate, t !== null && (e = t.memoizedState)), e !== null) return e.dehydrated;
    }
    return null;
  }
  function g(t) {
    if (t.tag === 31) {
      var e = t.memoizedState;
      if (e === null && (t = t.alternate, t !== null && (e = t.memoizedState)), e !== null) return e.dehydrated;
    }
    return null;
  }
  function S(t) {
    if (f(t) !== t)
      throw Error(r(188));
  }
  function v(t) {
    var e = t.alternate;
    if (!e) {
      if (e = f(t), e === null) throw Error(r(188));
      return e !== t ? null : t;
    }
    for (var n = t, a = e; ; ) {
      var u = n.return;
      if (u === null) break;
      var c = u.alternate;
      if (c === null) {
        if (a = u.return, a !== null) {
          n = a;
          continue;
        }
        break;
      }
      if (u.child === c.child) {
        for (c = u.child; c; ) {
          if (c === n) return S(u), t;
          if (c === a) return S(u), e;
          c = c.sibling;
        }
        throw Error(r(188));
      }
      if (n.return !== a.return) n = u, a = c;
      else {
        for (var h = !1, x = u.child; x; ) {
          if (x === n) {
            h = !0, n = u, a = c;
            break;
          }
          if (x === a) {
            h = !0, a = u, n = c;
            break;
          }
          x = x.sibling;
        }
        if (!h) {
          for (x = c.child; x; ) {
            if (x === n) {
              h = !0, n = c, a = u;
              break;
            }
            if (x === a) {
              h = !0, a = c, n = u;
              break;
            }
            x = x.sibling;
          }
          if (!h) throw Error(r(189));
        }
      }
      if (n.alternate !== a) throw Error(r(190));
    }
    if (n.tag !== 3) throw Error(r(188));
    return n.stateNode.current === n ? t : e;
  }
  function y(t) {
    var e = t.tag;
    if (e === 5 || e === 26 || e === 27 || e === 6) return t;
    for (t = t.child; t !== null; ) {
      if (e = y(t), e !== null) return e;
      t = t.sibling;
    }
    return null;
  }
  function m(t, e, n, a, u, c) {
    for (; t !== null; ) {
      if ((t.tag === 5 || t.tag === 27 || t.tag === 6) && n(t, a, u, c) || (t.tag !== 22 || t.memoizedState === null) && (e || t.tag !== 5 && t.tag !== 27) && m(
        t.child,
        e,
        n,
        a,
        u,
        c
      ))
        return !0;
      t = t.sibling;
    }
    return !1;
  }
  function p(t) {
    for (t = t.return; t !== null; ) {
      if (t.tag === 3 || t.tag === 5 || t.tag === 27) return t;
      t = t.return;
    }
    return null;
  }
  function b(t) {
    var e = !1;
    for (t = t.return; t !== null && (t.tag === 4 && (e = !0), !(t.tag === 3 || t.tag === 5 || t.tag === 27)); )
      t = t.return;
    return e;
  }
  function E(t) {
    var e = [null, null], n = p(t);
    return n === null || C(
      e,
      t,
      n.child,
      { foundSelf: !1 }
    ), e;
  }
  function C(t, e, n, a) {
    for (; n !== null; ) {
      if (n === e) a.foundSelf = !0;
      else if (n.tag === 5 || n.tag === 27 || n.tag === 6) {
        if (a.foundSelf) return t[1] = n, !0;
        t[0] = n;
      } else if ((n.tag !== 22 || n.memoizedState === null) && C(
        t,
        e,
        n.child,
        a
      ))
        return !0;
      n = n.sibling;
    }
    return !1;
  }
  function N(t) {
    switch (t.tag) {
      case 5:
      case 27:
      case 6:
        return t.stateNode;
      case 3:
        return t.stateNode.containerInfo;
      default:
        throw Error(r(559));
    }
  }
  var w = null, U = null;
  function _(t, e, n) {
    return t === n ? !0 : t === e ? (w = t, !0) : !1;
  }
  function A(t, e, n) {
    return t === n ? (U = t, !1) : t === e ? (U !== null && (w = t), !0) : !1;
  }
  function j(t) {
    if (t === null) return null;
    do
      t = t === null ? null : t.return;
    while (t && t.tag !== 5 && t.tag !== 27 && t.tag !== 3);
    return t || null;
  }
  function B(t, e, n) {
    for (var a = 0, u = t; u; u = n(u)) a++;
    u = 0;
    for (var c = e; c; c = n(c)) u++;
    for (; 0 < a - u; ) t = n(t), a--;
    for (; 0 < u - a; ) e = n(e), u--;
    for (; a--; ) {
      if (t === e || e !== null && t === e.alternate)
        return t;
      t = n(t), e = n(e);
    }
    return null;
  }
  var R = Object.assign, Z = /* @__PURE__ */ Symbol.for("react.element"), J = /* @__PURE__ */ Symbol.for("react.transitional.element"), it = /* @__PURE__ */ Symbol.for("react.portal"), tt = /* @__PURE__ */ Symbol.for("react.fragment"), ot = /* @__PURE__ */ Symbol.for("react.strict_mode"), lt = /* @__PURE__ */ Symbol.for("react.profiler"), M = /* @__PURE__ */ Symbol.for("react.consumer"), V = /* @__PURE__ */ Symbol.for("react.context"), O = /* @__PURE__ */ Symbol.for("react.forward_ref"), H = /* @__PURE__ */ Symbol.for("react.suspense"), X = /* @__PURE__ */ Symbol.for("react.suspense_list"), K = /* @__PURE__ */ Symbol.for("react.memo"), F = /* @__PURE__ */ Symbol.for("react.lazy"), at = /* @__PURE__ */ Symbol.for("react.activity"), dt = /* @__PURE__ */ Symbol.for("react.legacy_hidden"), pt = /* @__PURE__ */ Symbol.for("react.memo_cache_sentinel"), T = /* @__PURE__ */ Symbol.for("react.view_transition"), k = /* @__PURE__ */ Symbol.for("react.recoverable"), st = Symbol.iterator;
  function ut(t) {
    return t === null || typeof t != "object" ? null : (t = st && t[st] || t["@@iterator"], typeof t == "function" ? t : null);
  }
  var I = /* @__PURE__ */ Symbol.for("react.client.reference");
  function ft(t) {
    if (t == null) return null;
    if (typeof t == "function")
      return t.$$typeof === I ? null : t.displayName || t.name || null;
    if (typeof t == "string") return t;
    switch (t) {
      case tt:
        return "Fragment";
      case lt:
        return "Profiler";
      case ot:
        return "StrictMode";
      case H:
        return "Suspense";
      case X:
        return "SuspenseList";
      case at:
        return "Activity";
      case T:
        return "ViewTransition";
    }
    if (typeof t == "object")
      switch (t.$$typeof) {
        case it:
          return "Portal";
        case V:
          return t.displayName || "Context";
        case M:
          return (t._context.displayName || "Context") + ".Consumer";
        case O:
          var e = t.render;
          return t = t.displayName, t || (t = e.displayName || e.name || "", t = t !== "" ? "ForwardRef(" + t + ")" : "ForwardRef"), t;
        case K:
          return e = t.displayName || null, e !== null ? e : ft(t.type) || "Memo";
        case F:
          e = t._payload, t = t._init;
          try {
            return ft(t(e));
          } catch {
          }
      }
    return null;
  }
  var gt = Array.isArray, ct = i.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, rt = o.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, vt = {
    pending: !1,
    data: null,
    method: null,
    action: null
  }, wt = [], _t = -1;
  function Mt(t) {
    return { current: t };
  }
  function Ht(t) {
    0 > _t || (t.current = wt[_t], wt[_t] = null, _t--);
  }
  function Ot(t, e) {
    _t++, wt[_t] = t.current, t.current = e;
  }
  var Pt = Mt(null), xe = Mt(null), re = Mt(null), En = Mt(null);
  function Ie(t, e) {
    switch (Ot(re, e), Ot(xe, t), Ot(Pt, null), e.nodeType) {
      case 9:
      case 11:
        t = (t = e.documentElement) && (t = t.namespaceURI) ? Dm(t) : 0;
        break;
      default:
        if (t = e.tagName, e = e.namespaceURI)
          e = Dm(e), t = Rm(e, t);
        else
          switch (t) {
            case "svg":
              t = 1;
              break;
            case "math":
              t = 2;
              break;
            default:
              t = 0;
          }
    }
    Ht(Pt), Ot(Pt, t);
  }
  function Oe() {
    Ht(Pt), Ht(xe), Ht(re);
  }
  function _e(t) {
    var e = t.memoizedState;
    e !== null && (mi._currentValue = e.memoizedState, Ot(En, t)), e = Pt.current;
    var n = Rm(e, t.type);
    e !== n && (Ot(xe, t), Ot(Pt, n));
  }
  function De(t) {
    xe.current === t && (Ht(Pt), Ht(xe)), En.current === t && (Ht(En), mi._currentValue = vt);
  }
  var Ve, _n;
  function ke(t) {
    if (Ve === void 0)
      try {
        throw Error();
      } catch (n) {
        var e = n.stack.trim().match(/\n( *(at )?)/);
        Ve = e && e[1] || "", _n = -1 < n.stack.indexOf(`
    at`) ? " (<anonymous>)" : -1 < n.stack.indexOf("@") ? "@unknown:0:0" : "";
      }
    return `
` + Ve + t + _n;
  }
  var jl = !1;
  function Hi(t, e) {
    if (!t || jl) return "";
    jl = !0;
    var n = Error.prepareStackTrace;
    Error.prepareStackTrace = void 0;
    try {
      var a = {
        DetermineComponentFrameRoot: function() {
          try {
            if (e) {
              var nt = function() {
                throw Error();
              };
              if (Object.defineProperty(nt.prototype, "props", {
                set: function() {
                  throw Error();
                }
              }), typeof Reflect == "object" && Reflect.construct) {
                try {
                  Reflect.construct(nt, []);
                } catch (ht) {
                  var Y = ht;
                }
                Reflect.construct(t, [], nt);
              } else {
                try {
                  nt.call();
                } catch (ht) {
                  Y = ht;
                }
                nt = !1;
                try {
                  var Q = Object.getOwnPropertyDescriptor(
                    t.prototype,
                    "props"
                  );
                  Object.defineProperty(t.prototype, "props", {
                    configurable: !0,
                    set: function() {
                      throw Error();
                    }
                  }), nt = !0, new t();
                } finally {
                  nt && (Q !== void 0 ? Object.defineProperty(t.prototype, "props", Q) : delete t.prototype.props);
                }
              }
            } else {
              try {
                throw Error();
              } catch (ht) {
                Y = ht;
              }
              (nt = t()) && typeof nt.catch == "function" && nt.catch(function() {
              });
            }
          } catch (ht) {
            if (ht && Y && typeof ht.stack == "string")
              return [ht.stack, Y.stack];
          }
          return [null, null];
        }
      };
      a.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
      var u = Object.getOwnPropertyDescriptor(
        a.DetermineComponentFrameRoot,
        "name"
      );
      u && u.configurable && Object.defineProperty(
        a.DetermineComponentFrameRoot,
        "name",
        { value: "DetermineComponentFrameRoot" }
      );
      var c = a.DetermineComponentFrameRoot(), h = c[0], x = c[1];
      if (h && x) {
        var z = h.split(`
`), q = x.split(`
`);
        for (u = a = 0; a < z.length && !z[a].includes("DetermineComponentFrameRoot"); )
          a++;
        for (; u < q.length && !q[u].includes(
          "DetermineComponentFrameRoot"
        ); )
          u++;
        if (a === z.length || u === q.length)
          for (a = z.length - 1, u = q.length - 1; 1 <= a && 0 <= u && z[a] !== q[u]; )
            u--;
        for (; 1 <= a && 0 <= u; a--, u--)
          if (z[a] !== q[u]) {
            if (a !== 1 || u !== 1)
              do
                if (a--, u--, 0 > u || z[a] !== q[u]) {
                  var $ = `
` + z[a].replace(" at new ", " at ");
                  return t.displayName && $.includes("<anonymous>") && ($ = $.replace("<anonymous>", t.displayName)), $;
                }
              while (1 <= a && 0 <= u);
            break;
          }
      }
    } finally {
      jl = !1, Error.prepareStackTrace = n;
    }
    return (n = t ? t.displayName || t.name : "") ? ke(n) : "";
  }
  function Nr(t, e) {
    switch (t.tag) {
      case 26:
      case 27:
      case 5:
        return ke(t.type);
      case 16:
        return ke("Lazy");
      case 13:
        return t.child !== e && e !== null ? ke("Suspense Fallback") : ke("Suspense");
      case 19:
        return ke("SuspenseList");
      case 0:
      case 15:
        return Hi(t.type, !1);
      case 11:
        return Hi(t.type.render, !1);
      case 1:
        return Hi(t.type, !0);
      case 31:
        return ke("Activity");
      case 30:
        return ke("ViewTransition");
      default:
        return "";
    }
  }
  function no(t) {
    try {
      var e = "", n = null;
      do
        e += Nr(t, n), n = t, t = t.return;
      while (t);
      return e;
    } catch (a) {
      return `
Error generating stack: ` + a.message + `
` + a.stack;
    }
  }
  var Ui = Object.prototype.hasOwnProperty, Bi = l.unstable_scheduleCallback, Yi = l.unstable_cancelCallback, Tr = l.unstable_shouldYield, Mr = l.unstable_requestPaint, we = l.unstable_now, zr = l.unstable_getCurrentPriorityLevel, lo = l.unstable_ImmediatePriority, ao = l.unstable_UserBlockingPriority, Na = l.unstable_NormalPriority, Cr = l.unstable_LowPriority, io = l.unstable_IdlePriority, Ar = l.log, Or = l.unstable_setDisableYieldValue, Zl = null, Ne = null;
  function wn(t) {
    if (typeof Ar == "function" && Or(t), Ne && typeof Ne.setStrictMode == "function")
      try {
        Ne.setStrictMode(Zl, t);
      } catch {
      }
  }
  var Te = Math.clz32 ? Math.clz32 : Hr, Dr = Math.log, Rr = Math.LN2;
  function Hr(t) {
    return t >>>= 0, t === 0 ? 32 : 31 - (Dr(t) / Rr | 0) | 0;
  }
  var Ta = 256, Ma = 262144, za = 4194304;
  function qn(t) {
    var e = t & 42;
    if (e !== 0) return e;
    switch (t & -t) {
      case 1:
        return 1;
      case 2:
        return 2;
      case 4:
        return 4;
      case 8:
        return 8;
      case 16:
        return 16;
      case 32:
        return 32;
      case 64:
        return 64;
      case 128:
        return 128;
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
        return t & -t;
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return t & 3932160;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
        return t & 62914560;
      case 67108864:
        return 67108864;
      case 134217728:
        return 134217728;
      case 268435456:
        return 268435456;
      case 536870912:
        return 536870912;
      case 1073741824:
        return 0;
      default:
        return t;
    }
  }
  function Ca(t, e, n) {
    var a = t.pendingLanes;
    if (a === 0) return 0;
    var u = 0, c = t.suspendedLanes, h = t.pingedLanes;
    t = t.warmLanes;
    var x = a & 134217727;
    return x !== 0 ? (a = x & ~c, a !== 0 ? u = qn(a) : (h &= x, h !== 0 ? u = qn(h) : n || (n = x & ~t, n !== 0 && (u = qn(n))))) : (x = a & ~c, x !== 0 ? u = qn(x) : h !== 0 ? u = qn(h) : n || (n = a & ~t, n !== 0 && (u = qn(n)))), u === 0 ? 0 : e !== 0 && e !== u && (e & c) === 0 && (c = u & -u, n = e & -e, c >= n || c === 32 && (n & 4194048) !== 0) ? e : u;
  }
  function Gl(t, e) {
    return (t.pendingLanes & ~(t.suspendedLanes & ~t.pingedLanes) & e) === 0;
  }
  function Vi(t, e) {
    (e & 8) !== 0 && (e |= e & 32);
    var n = t.entangledLanes;
    if (n !== 0)
      for (t = t.entanglements, n &= e; 0 < n; ) {
        var a = 31 - Te(n), u = 1 << a;
        e |= t[a], n &= ~u;
      }
    return e;
  }
  function uo(t, e) {
    switch (t) {
      case 1:
      case 2:
      case 4:
      case 8:
      case 64:
        return e + 250;
      case 16:
      case 32:
      case 128:
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return e + 5e3;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
        return -1;
      case 67108864:
      case 134217728:
      case 268435456:
      case 536870912:
      case 1073741824:
        return -1;
      default:
        return -1;
    }
  }
  function Li() {
    var t = za;
    return za <<= 1, (za & 62914560) === 0 && (za = 4194304), t;
  }
  function qi(t) {
    for (var e = [], n = 0; 31 > n; n++) e.push(t);
    return e;
  }
  function Ql(t, e) {
    t.pendingLanes |= e, e !== 268435456 && (t.suspendedLanes = 0, t.pingedLanes = 0, t.warmLanes = 0);
  }
  function Ur(t, e, n, a, u, c) {
    var h = t.pendingLanes;
    t.pendingLanes = n, t.suspendedLanes = 0, t.pingedLanes = 0, t.warmLanes = 0, t.expiredLanes &= n, t.entangledLanes &= n, t.errorRecoveryDisabledLanes &= n, t.shellSuspendCounter = 0;
    var x = t.entanglements, z = t.expirationTimes, q = t.hiddenUpdates;
    for (n = h & ~n; 0 < n; ) {
      var $ = 31 - Te(n), nt = 1 << $;
      x[$] = 0, z[$] = -1;
      var Y = q[$];
      if (Y !== null)
        for (q[$] = null, $ = 0; $ < Y.length; $++) {
          var Q = Y[$];
          Q !== null && (Q.lane &= -536870913);
        }
      n &= ~nt;
    }
    a !== 0 && oo(t, a, 0), c !== 0 && u === 0 && t.tag !== 0 && (t.suspendedLanes |= c & ~(h & ~e));
  }
  function oo(t, e, n) {
    t.pendingLanes |= e, t.suspendedLanes &= ~e;
    var a = 31 - Te(e);
    t.entangledLanes |= e, t.entanglements[a] = t.entanglements[a] | 1073741824 | n & 261930;
  }
  function co(t, e) {
    var n = t.entangledLanes |= e;
    for (t = t.entanglements; n; ) {
      var a = 31 - Te(n), u = 1 << a;
      u & e | t[a] & e && (t[a] |= e), n &= ~u;
    }
  }
  function ro(t, e) {
    var n = e & -e;
    return n = (n & 42) !== 0 ? 1 : Aa(n), (n & (t.suspendedLanes | e)) !== 0 ? 0 : n;
  }
  function Aa(t) {
    switch (t) {
      case 2:
        t = 1;
        break;
      case 8:
        t = 4;
        break;
      case 32:
        t = 16;
        break;
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
        t = 128;
        break;
      case 268435456:
        t = 134217728;
        break;
      default:
        t = 0;
    }
    return t;
  }
  function Xi(t) {
    return t &= -t, 2 < t ? 8 < t ? (t & 134217727) !== 0 ? 32 : 268435456 : 8 : 2;
  }
  function so() {
    var t = rt.p;
    return t !== 0 ? t : (t = window.event, t === void 0 ? 32 : yy(t.type));
  }
  function fo(t, e) {
    var n = rt.p;
    try {
      return rt.p = t, e();
    } finally {
      rt.p = n;
    }
  }
  var on = Math.random().toString(36).slice(2), oe = "__reactFiber$" + on, be = "__reactProps$" + on, ol = "__reactContainer$" + on, ho = "__reactEvents$" + on, go = "__reactListeners$" + on, Br = "__reactHandles$" + on, mo = "__reactResources$" + on, Kl = "__reactMarker$" + on, Oa = "__reactLoad$" + on;
  function Da(t) {
    delete t[oe], delete t[be], delete t[go], delete t[Br];
  }
  function Xn(t) {
    var e;
    if (e = t[oe]) return e;
    for (var n = t.parentNode; n; ) {
      if (e = n[ol] || n[oe]) {
        if (n = e.alternate, e.child !== null || n !== null && n.child !== null)
          for (t = km(t); t !== null; ) {
            if (n = t[oe]) return n;
            t = km(t);
          }
        return e;
      }
      t = n, n = t.parentNode;
    }
    return null;
  }
  function cl(t) {
    if (t = t[oe] || t[ol]) {
      var e = t.tag;
      if (e === 5 || e === 6 || e === 13 || e === 31 || e === 26 || e === 27 || e === 3)
        return t;
    }
    return null;
  }
  function $l(t) {
    var e = t.tag;
    if (e === 5 || e === 26 || e === 27 || e === 6) return t.stateNode;
    throw Error(r(33));
  }
  function jn(t) {
    var e = t[mo];
    return e || (e = t[mo] = { hoistableStyles: /* @__PURE__ */ new Map(), hoistableScripts: /* @__PURE__ */ new Map() }), e;
  }
  function ee(t) {
    t[Kl] = !0;
  }
  function ji(t) {
    t[Oa] = void 0;
  }
  var yo = /* @__PURE__ */ new Set(), vo = {};
  function cn(t, e) {
    rl(t, e), rl(t + "Capture", e);
  }
  function rl(t, e) {
    for (vo[t] = e, t = 0; t < e.length; t++)
      yo.add(e[t]);
  }
  var Yr = RegExp(
    "^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"
  ), Zi = {}, vh = {};
  function K1(t) {
    return Ui.call(vh, t) ? !0 : Ui.call(Zi, t) ? !1 : Yr.test(t) ? vh[t] = !0 : (Zi[t] = !0, !1);
  }
  var Yt = !1;
  function ph() {
    var t = Yt;
    return Yt = !1, t;
  }
  function po(t, e, n) {
    if (K1(e))
      if (n === null) t.removeAttribute(e);
      else {
        switch (typeof n) {
          case "undefined":
          case "function":
          case "symbol":
            t.removeAttribute(e);
            return;
          case "boolean":
            var a = e.toLowerCase().slice(0, 5);
            if (a !== "data-" && a !== "aria-") {
              t.removeAttribute(e);
              return;
            }
        }
        t.setAttribute(e, n);
      }
  }
  function So(t, e, n) {
    if (n === null) t.removeAttribute(e);
    else {
      switch (typeof n) {
        case "undefined":
        case "function":
        case "symbol":
        case "boolean":
          t.removeAttribute(e);
          return;
      }
      t.setAttribute(e, n);
    }
  }
  function Zn(t, e, n, a) {
    if (a === null) t.removeAttribute(n);
    else {
      switch (typeof a) {
        case "undefined":
        case "function":
        case "symbol":
        case "boolean":
          t.removeAttribute(n);
          return;
      }
      t.setAttributeNS(e, n, a);
    }
  }
  function Le(t) {
    switch (typeof t) {
      case "bigint":
      case "boolean":
      case "number":
      case "string":
      case "undefined":
        return t;
      case "object":
        return t;
      default:
        return "";
    }
  }
  function Sh(t) {
    var e = t.type;
    return (t = t.nodeName) && t.toLowerCase() === "input" && (e === "checkbox" || e === "radio");
  }
  function $1(t, e, n) {
    var a = Object.getOwnPropertyDescriptor(
      t.constructor.prototype,
      e
    );
    if (!t.hasOwnProperty(e) && typeof a < "u" && typeof a.get == "function" && typeof a.set == "function") {
      var u = a.get, c = a.set;
      return Object.defineProperty(t, e, {
        configurable: !0,
        get: function() {
          return u.call(this);
        },
        set: function(h) {
          n = "" + h, c.call(this, h);
        }
      }), Object.defineProperty(t, e, {
        enumerable: a.enumerable
      }), {
        getValue: function() {
          return n;
        },
        setValue: function(h) {
          n = "" + h;
        },
        stopTracking: function() {
          t._valueTracker = null, delete t[e];
        }
      };
    }
  }
  function Vr(t) {
    if (!t._valueTracker) {
      var e = Sh(t) ? "checked" : "value";
      t._valueTracker = $1(
        t,
        e,
        "" + t[e]
      );
    }
  }
  function xh(t) {
    if (!t) return !1;
    var e = t._valueTracker;
    if (!e) return !0;
    var n = e.getValue(), a = "";
    return t && (a = Sh(t) ? t.checked ? "true" : "false" : t.value), t = a, t !== n ? (e.setValue(t), !0) : !1;
  }
  var J1 = /[\n"\\]/g;
  function Fe(t) {
    return t.replace(
      J1,
      function(e) {
        return "\\" + e.charCodeAt(0).toString(16) + " ";
      }
    );
  }
  function Lr(t, e, n, a, u, c, h, x) {
    t.name = "", h != null && typeof h != "function" && typeof h != "symbol" && typeof h != "boolean" ? t.type = h : t.removeAttribute("type"), e != null ? h === "number" ? (e === 0 && t.value === "" || t.value != e) && (t.value = "" + Le(e)) : t.value !== "" + Le(e) && (t.value = "" + Le(e)) : h !== "submit" && h !== "reset" || t.removeAttribute("value"), e != null ? h === "number" && t.value == e ? qr(t, Le(t.value)) : qr(t, Le(e)) : n != null ? qr(t, Le(n)) : a != null && t.removeAttribute("value"), u == null && c != null && (t.defaultChecked = !!c), u != null && (t.checked = u && typeof u != "function" && typeof u != "symbol"), x != null && typeof x != "function" && typeof x != "symbol" && typeof x != "boolean" ? t.name = "" + Le(x) : t.removeAttribute("name");
  }
  function bh(t, e, n, a, u, c, h, x) {
    if (c != null && typeof c != "function" && typeof c != "symbol" && typeof c != "boolean" && (t.type = c), e != null || n != null) {
      if (!(c !== "submit" && c !== "reset" || e != null)) {
        Vr(t);
        return;
      }
      n = n != null ? "" + Le(n) : "", e = e != null ? "" + Le(e) : n, x || e === t.value || (t.value = e), t.defaultValue = e;
    }
    a = a ?? u, a = typeof a != "function" && typeof a != "symbol" && !!a, t.checked = x ? t.checked : !!a, t.defaultChecked = !!a, h != null && typeof h != "function" && typeof h != "symbol" && typeof h != "boolean" && (t.name = h), Vr(t);
  }
  function qr(t, e) {
    t.defaultValue !== "" + e && (t.defaultValue = "" + e);
  }
  function Ra(t, e, n, a) {
    if (t = t.options, e) {
      e = {};
      for (var u = 0; u < n.length; u++)
        e["$" + n[u]] = !0;
      for (n = 0; n < t.length; n++)
        u = e.hasOwnProperty("$" + t[n].value), t[n].selected !== u && (t[n].selected = u), u && a && (t[n].defaultSelected = !0);
    } else {
      for (n = "" + Le(n), e = null, u = 0; u < t.length; u++) {
        if (t[u].value === n) {
          t[u].selected = !0, a && (t[u].defaultSelected = !0);
          return;
        }
        e !== null || t[u].disabled || (e = t[u]);
      }
      e !== null && (e.selected = !0);
    }
  }
  function Eh(t, e, n) {
    if (e != null && (e = "" + Le(e), e !== t.value && (t.value = e), n == null)) {
      t.defaultValue !== e && (t.defaultValue = e);
      return;
    }
    t.defaultValue = n != null ? "" + Le(n) : "";
  }
  function _h(t, e, n, a) {
    if (e == null) {
      if (a != null) {
        if (n != null) throw Error(r(92));
        if (gt(a)) {
          if (1 < a.length) throw Error(r(93));
          a = a[0];
        }
        n = a;
      }
      n == null && (n = ""), e = n;
    }
    n = Le(e), t.defaultValue = n, a = t.textContent, a === n && a !== "" && a !== null && (t.value = a), Vr(t);
  }
  function Ha(t, e) {
    if (e) {
      var n = t.firstChild;
      if (n && n === t.lastChild && n.nodeType === 3) {
        n.nodeValue = e;
        return;
      }
    }
    t.textContent = e;
  }
  var I1 = new Set(
    "animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(
      " "
    )
  );
  function wh(t, e, n) {
    var a = e.indexOf("--") === 0;
    n == null || typeof n == "boolean" || n === "" ? a ? t.setProperty(e, "") : e === "float" ? t.cssFloat = "" : t[e] = "" : a ? t.setProperty(e, n) : typeof n != "number" || n === 0 || I1.has(e) ? e === "float" ? t.cssFloat = n : t[e] = ("" + n).trim() : t[e] = n + "px";
  }
  function Nh(t, e, n) {
    if (e != null && typeof e != "object")
      throw Error(r(62));
    if (t = t.style, n != null) {
      for (var a in n)
        !n.hasOwnProperty(a) || e != null && e.hasOwnProperty(a) || (a.indexOf("--") === 0 ? t.setProperty(a, "") : a === "float" ? t.cssFloat = "" : t[a] = "", Yt = !0);
      for (var u in e)
        a = e[u], e.hasOwnProperty(u) && n[u] !== a && (wh(t, u, a), Yt = !0);
    } else
      for (var c in e)
        e.hasOwnProperty(c) && wh(t, c, e[c]);
  }
  function Xr(t) {
    if (t.indexOf("-") === -1) return !1;
    switch (t) {
      case "annotation-xml":
      case "color-profile":
      case "font-face":
      case "font-face-src":
      case "font-face-uri":
      case "font-face-format":
      case "font-face-name":
      case "missing-glyph":
        return !1;
      default:
        return !0;
    }
  }
  var k1 = /* @__PURE__ */ new Map([
    ["acceptCharset", "accept-charset"],
    ["htmlFor", "for"],
    ["httpEquiv", "http-equiv"],
    ["crossOrigin", "crossorigin"],
    ["accentHeight", "accent-height"],
    ["alignmentBaseline", "alignment-baseline"],
    ["arabicForm", "arabic-form"],
    ["baselineShift", "baseline-shift"],
    ["capHeight", "cap-height"],
    ["clipPath", "clip-path"],
    ["clipRule", "clip-rule"],
    ["colorInterpolation", "color-interpolation"],
    ["colorInterpolationFilters", "color-interpolation-filters"],
    ["colorProfile", "color-profile"],
    ["colorRendering", "color-rendering"],
    ["dominantBaseline", "dominant-baseline"],
    ["enableBackground", "enable-background"],
    ["fillOpacity", "fill-opacity"],
    ["fillRule", "fill-rule"],
    ["floodColor", "flood-color"],
    ["floodOpacity", "flood-opacity"],
    ["fontFamily", "font-family"],
    ["fontSize", "font-size"],
    ["fontSizeAdjust", "font-size-adjust"],
    ["fontStretch", "font-stretch"],
    ["fontStyle", "font-style"],
    ["fontVariant", "font-variant"],
    ["fontWeight", "font-weight"],
    ["glyphName", "glyph-name"],
    ["glyphOrientationHorizontal", "glyph-orientation-horizontal"],
    ["glyphOrientationVertical", "glyph-orientation-vertical"],
    ["horizAdvX", "horiz-adv-x"],
    ["horizOriginX", "horiz-origin-x"],
    ["imageRendering", "image-rendering"],
    ["letterSpacing", "letter-spacing"],
    ["lightingColor", "lighting-color"],
    ["markerEnd", "marker-end"],
    ["markerMid", "marker-mid"],
    ["markerStart", "marker-start"],
    ["maskType", "mask-type"],
    ["overlinePosition", "overline-position"],
    ["overlineThickness", "overline-thickness"],
    ["paintOrder", "paint-order"],
    ["panose-1", "panose-1"],
    ["pointerEvents", "pointer-events"],
    ["renderingIntent", "rendering-intent"],
    ["shapeRendering", "shape-rendering"],
    ["stopColor", "stop-color"],
    ["stopOpacity", "stop-opacity"],
    ["strikethroughPosition", "strikethrough-position"],
    ["strikethroughThickness", "strikethrough-thickness"],
    ["strokeDasharray", "stroke-dasharray"],
    ["strokeDashoffset", "stroke-dashoffset"],
    ["strokeLinecap", "stroke-linecap"],
    ["strokeLinejoin", "stroke-linejoin"],
    ["strokeMiterlimit", "stroke-miterlimit"],
    ["strokeOpacity", "stroke-opacity"],
    ["strokeWidth", "stroke-width"],
    ["textAnchor", "text-anchor"],
    ["textDecoration", "text-decoration"],
    ["textRendering", "text-rendering"],
    ["transformOrigin", "transform-origin"],
    ["underlinePosition", "underline-position"],
    ["underlineThickness", "underline-thickness"],
    ["unicodeBidi", "unicode-bidi"],
    ["unicodeRange", "unicode-range"],
    ["unitsPerEm", "units-per-em"],
    ["vAlphabetic", "v-alphabetic"],
    ["vHanging", "v-hanging"],
    ["vIdeographic", "v-ideographic"],
    ["vMathematical", "v-mathematical"],
    ["vectorEffect", "vector-effect"],
    ["vertAdvY", "vert-adv-y"],
    ["vertOriginX", "vert-origin-x"],
    ["vertOriginY", "vert-origin-y"],
    ["wordSpacing", "word-spacing"],
    ["writingMode", "writing-mode"],
    ["xmlnsXlink", "xmlns:xlink"],
    ["xHeight", "x-height"]
  ]), F1 = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
  function xo(t) {
    return F1.test("" + t) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : t;
  }
  function Nn() {
  }
  var jr = null;
  function Zr(t) {
    return t = t.target || t.srcElement || window, t.correspondingUseElement && (t = t.correspondingUseElement), t.nodeType === 3 ? t.parentNode : t;
  }
  var Ua = null, Ba = null;
  function Th(t) {
    var e = cl(t);
    if (e && (t = e.stateNode)) {
      var n = t[be] || null;
      t: switch (t = e.stateNode, e.type) {
        case "input":
          if (Lr(
            t,
            n.value,
            n.defaultValue,
            n.defaultValue,
            n.checked,
            n.defaultChecked,
            n.type,
            n.name
          ), e = n.name, n.type === "radio" && e != null) {
            for (n = t; n.parentNode; ) n = n.parentNode;
            for (n = n.querySelectorAll(
              'input[name="' + Fe(
                "" + e
              ) + '"][type="radio"]'
            ), e = 0; e < n.length; e++) {
              var a = n[e];
              if (a !== t && a.form === t.form) {
                var u = a[be] || null;
                if (!u) throw Error(r(90));
                Lr(
                  a,
                  u.value,
                  u.defaultValue,
                  u.defaultValue,
                  u.checked,
                  u.defaultChecked,
                  u.type,
                  u.name
                );
              }
            }
            for (e = 0; e < n.length; e++)
              a = n[e], a.form === t.form && xh(a);
          }
          break t;
        case "textarea":
          Eh(t, n.value, n.defaultValue);
          break t;
        case "select":
          e = n.value, e != null && Ra(t, !!n.multiple, e, !1);
      }
    }
  }
  var Gr = !1;
  function Mh(t, e, n) {
    if (Gr) return t(e, n);
    Gr = !0;
    try {
      var a = t(e);
      return a;
    } finally {
      if (Gr = !1, (Ua !== null || Ba !== null) && (xc(), Ua && (e = Ua, t = Ba, Ba = Ua = null, Th(e), t)))
        for (e = 0; e < t.length; e++) Th(t[e]);
    }
  }
  function Gi(t, e) {
    var n = t.stateNode;
    if (n === null) return null;
    var a = n[be] || null;
    if (a === null) return null;
    n = a[e];
    t: switch (e) {
      case "onClick":
      case "onClickCapture":
      case "onDoubleClick":
      case "onDoubleClickCapture":
      case "onMouseDown":
      case "onMouseDownCapture":
      case "onMouseMove":
      case "onMouseMoveCapture":
      case "onMouseUp":
      case "onMouseUpCapture":
      case "onMouseEnter":
        (a = !a.disabled) || (t = t.type, a = !(t === "button" || t === "input" || t === "select" || t === "textarea")), t = !a;
        break t;
      default:
        t = !1;
    }
    if (t) return null;
    if (n && typeof n != "function")
      throw Error(
        r(231, e, typeof n)
      );
    return n;
  }
  var Gn = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), Qr = !1;
  if (Gn)
    try {
      var Qi = {};
      Object.defineProperty(Qi, "passive", {
        get: function() {
          Qr = !0;
        }
      }), window.addEventListener("test", Qi, Qi), window.removeEventListener("test", Qi, Qi);
    } catch {
      Qr = !1;
    }
  var sl = null, Kr = null, bo = null;
  function zh() {
    if (bo) return bo;
    var t, e = Kr, n = e.length, a, u = "value" in sl ? sl.value : sl.textContent, c = u.length;
    for (t = 0; t < n && e[t] === u[t]; t++) ;
    var h = n - t;
    for (a = 1; a <= h && e[n - a] === u[c - a]; a++) ;
    return bo = u.slice(t, 1 < a ? 1 - a : void 0);
  }
  function Eo(t) {
    var e = t.keyCode;
    return "charCode" in t ? (t = t.charCode, t === 0 && e === 13 && (t = 13)) : t = e, t === 10 && (t = 13), 32 <= t || t === 13 ? t : 0;
  }
  function _o() {
    return !0;
  }
  function Ch() {
    return !1;
  }
  function Me(t) {
    function e(n, a, u, c, h) {
      this._reactName = n, this._targetInst = u, this.type = a, this.nativeEvent = c, this.target = h, this.currentTarget = null;
      for (var x in t)
        t.hasOwnProperty(x) && (n = t[x], this[x] = n ? n(c) : c[x]);
      return this.isDefaultPrevented = (c.defaultPrevented != null ? c.defaultPrevented : c.returnValue === !1) ? _o : Ch, this.isPropagationStopped = Ch, this;
    }
    return R(e.prototype, {
      preventDefault: function() {
        this.defaultPrevented = !0;
        var n = this.nativeEvent;
        n && (n.preventDefault ? n.preventDefault() : typeof n.returnValue != "unknown" && (n.returnValue = !1), this.isDefaultPrevented = _o);
      },
      stopPropagation: function() {
        var n = this.nativeEvent;
        n && (n.stopPropagation ? n.stopPropagation() : typeof n.cancelBubble != "unknown" && (n.cancelBubble = !0), this.isPropagationStopped = _o);
      },
      persist: function() {
      },
      isPersistent: _o
    }), e;
  }
  var fl = {
    eventPhase: 0,
    bubbles: 0,
    cancelable: 0,
    timeStamp: function(t) {
      return t.timeStamp || Date.now();
    },
    defaultPrevented: 0,
    isTrusted: 0
  }, wo = Me(fl), Ki = R({}, fl, { view: 0, detail: 0 }), W1 = Me(Ki), $r, Jr, $i, No = R({}, Ki, {
    screenX: 0,
    screenY: 0,
    clientX: 0,
    clientY: 0,
    pageX: 0,
    pageY: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    getModifierState: kr,
    button: 0,
    buttons: 0,
    relatedTarget: function(t) {
      return t.relatedTarget === void 0 ? t.fromElement === t.srcElement ? t.toElement : t.fromElement : t.relatedTarget;
    },
    movementX: function(t) {
      return "movementX" in t ? t.movementX : (t !== $i && ($i && t.type === "mousemove" ? ($r = t.screenX - $i.screenX, Jr = t.screenY - $i.screenY) : Jr = $r = 0, $i = t), $r);
    },
    movementY: function(t) {
      return "movementY" in t ? t.movementY : Jr;
    }
  }), Ah = Me(No), P1 = R({}, No, { dataTransfer: 0 }), tS = Me(P1), eS = R({}, Ki, { relatedTarget: 0 }), Ir = Me(eS), nS = R({}, fl, {
    animationName: 0,
    elapsedTime: 0,
    pseudoElement: 0
  }), lS = Me(nS), aS = R({}, fl, {
    clipboardData: function(t) {
      return "clipboardData" in t ? t.clipboardData : window.clipboardData;
    }
  }), iS = Me(aS), uS = R({}, fl, { data: 0 }), Oh = Me(uS), oS = {
    Esc: "Escape",
    Spacebar: " ",
    Left: "ArrowLeft",
    Up: "ArrowUp",
    Right: "ArrowRight",
    Down: "ArrowDown",
    Del: "Delete",
    Win: "OS",
    Menu: "ContextMenu",
    Apps: "ContextMenu",
    Scroll: "ScrollLock",
    MozPrintableKey: "Unidentified"
  }, cS = {
    8: "Backspace",
    9: "Tab",
    12: "Clear",
    13: "Enter",
    16: "Shift",
    17: "Control",
    18: "Alt",
    19: "Pause",
    20: "CapsLock",
    27: "Escape",
    32: " ",
    33: "PageUp",
    34: "PageDown",
    35: "End",
    36: "Home",
    37: "ArrowLeft",
    38: "ArrowUp",
    39: "ArrowRight",
    40: "ArrowDown",
    45: "Insert",
    46: "Delete",
    112: "F1",
    113: "F2",
    114: "F3",
    115: "F4",
    116: "F5",
    117: "F6",
    118: "F7",
    119: "F8",
    120: "F9",
    121: "F10",
    122: "F11",
    123: "F12",
    144: "NumLock",
    145: "ScrollLock",
    224: "Meta"
  }, rS = {
    Alt: "altKey",
    Control: "ctrlKey",
    Meta: "metaKey",
    Shift: "shiftKey"
  };
  function sS(t) {
    var e = this.nativeEvent;
    return e.getModifierState ? e.getModifierState(t) : (t = rS[t]) ? !!e[t] : !1;
  }
  function kr() {
    return sS;
  }
  var fS = R({}, Ki, {
    key: function(t) {
      if (t.key) {
        var e = oS[t.key] || t.key;
        if (e !== "Unidentified") return e;
      }
      return t.type === "keypress" ? (t = Eo(t), t === 13 ? "Enter" : String.fromCharCode(t)) : t.type === "keydown" || t.type === "keyup" ? cS[t.keyCode] || "Unidentified" : "";
    },
    code: 0,
    location: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    repeat: 0,
    locale: 0,
    getModifierState: kr,
    charCode: function(t) {
      return t.type === "keypress" ? Eo(t) : 0;
    },
    keyCode: function(t) {
      return t.type === "keydown" || t.type === "keyup" ? t.keyCode : 0;
    },
    which: function(t) {
      return t.type === "keypress" ? Eo(t) : t.type === "keydown" || t.type === "keyup" ? t.keyCode : 0;
    }
  }), dS = Me(fS), hS = R({}, No, {
    pointerId: 0,
    width: 0,
    height: 0,
    pressure: 0,
    tangentialPressure: 0,
    tiltX: 0,
    tiltY: 0,
    twist: 0,
    pointerType: 0,
    isPrimary: 0
  }), Dh = Me(hS), gS = R({}, fl, { submitter: 0 }), mS = Me(gS), yS = R({}, Ki, {
    touches: 0,
    targetTouches: 0,
    changedTouches: 0,
    altKey: 0,
    metaKey: 0,
    ctrlKey: 0,
    shiftKey: 0,
    getModifierState: kr
  }), vS = Me(yS), pS = R({}, fl, {
    propertyName: 0,
    elapsedTime: 0,
    pseudoElement: 0
  }), SS = Me(pS), xS = R({}, No, {
    deltaX: function(t) {
      return "deltaX" in t ? t.deltaX : "wheelDeltaX" in t ? -t.wheelDeltaX : 0;
    },
    deltaY: function(t) {
      return "deltaY" in t ? t.deltaY : "wheelDeltaY" in t ? -t.wheelDeltaY : "wheelDelta" in t ? -t.wheelDelta : 0;
    },
    deltaZ: 0,
    deltaMode: 0
  }), bS = Me(xS), ES = R({}, fl, {
    newState: 0,
    oldState: 0,
    source: 0
  }), _S = Me(ES), wS = [9, 13, 27, 32], Fr = Gn && "CompositionEvent" in window, Ji = null;
  Gn && "documentMode" in document && (Ji = document.documentMode);
  var NS = Gn && "TextEvent" in window && !Ji, Rh = Gn && (!Fr || Ji && 8 < Ji && 11 >= Ji), Hh = " ", Uh = !1;
  function Bh(t, e) {
    switch (t) {
      case "keyup":
        return wS.indexOf(e.keyCode) !== -1;
      case "keydown":
        return e.keyCode !== 229;
      case "keypress":
      case "mousedown":
      case "focusout":
        return !0;
      default:
        return !1;
    }
  }
  function Yh(t) {
    return t = t.detail, typeof t == "object" && "data" in t ? t.data : null;
  }
  var Ya = !1;
  function TS(t, e) {
    switch (t) {
      case "compositionend":
        return Yh(e);
      case "keypress":
        return e.which !== 32 ? null : (Uh = !0, Hh);
      case "textInput":
        return t = e.data, t === Hh && Uh ? null : t;
      default:
        return null;
    }
  }
  function MS(t, e) {
    if (Ya)
      return t === "compositionend" || !Fr && Bh(t, e) ? (t = zh(), bo = Kr = sl = null, Ya = !1, t) : null;
    switch (t) {
      case "paste":
        return null;
      case "keypress":
        if (!(e.ctrlKey || e.altKey || e.metaKey) || e.ctrlKey && e.altKey) {
          if (e.char && 1 < e.char.length)
            return e.char;
          if (e.which) return String.fromCharCode(e.which);
        }
        return null;
      case "compositionend":
        return Rh && e.locale !== "ko" ? null : e.data;
      default:
        return null;
    }
  }
  var zS = {
    color: !0,
    date: !0,
    datetime: !0,
    "datetime-local": !0,
    email: !0,
    month: !0,
    number: !0,
    password: !0,
    range: !0,
    search: !0,
    tel: !0,
    text: !0,
    time: !0,
    url: !0,
    week: !0
  };
  function Vh(t) {
    var e = t && t.nodeName && t.nodeName.toLowerCase();
    return e === "input" ? !!zS[t.type] : e === "textarea";
  }
  function Lh(t, e, n, a) {
    Ua ? Ba ? Ba.push(a) : Ba = [a] : Ua = a, e = Tc(e, "onChange"), 0 < e.length && (n = new wo(
      "onChange",
      "change",
      null,
      n,
      a
    ), t.push({ event: n, listeners: e }));
  }
  var Ii = null, ki = null;
  function CS(t) {
    Tm(t, 0);
  }
  function To(t) {
    var e = $l(t);
    if (xh(e)) return t;
  }
  function qh(t, e) {
    if (t === "change") return e;
  }
  var Xh = !1;
  if (Gn) {
    var Wr;
    if (Gn) {
      var Pr = "oninput" in document;
      if (!Pr) {
        var jh = document.createElement("div");
        jh.setAttribute("oninput", "return;"), Pr = typeof jh.oninput == "function";
      }
      Wr = Pr;
    } else Wr = !1;
    Xh = Wr && (!document.documentMode || 9 < document.documentMode);
  }
  function Zh() {
    Ii && (Ii.detachEvent("onpropertychange", Gh), ki = Ii = null);
  }
  function Gh(t) {
    if (t.propertyName === "value" && To(ki)) {
      var e = [];
      Lh(
        e,
        ki,
        t,
        Zr(t)
      ), Mh(CS, e);
    }
  }
  function AS(t, e, n) {
    t === "focusin" ? (Zh(), Ii = e, ki = n, Ii.attachEvent("onpropertychange", Gh)) : t === "focusout" && Zh();
  }
  function OS(t) {
    if (t === "selectionchange" || t === "keyup" || t === "keydown")
      return To(ki);
  }
  function DS(t, e) {
    if (t === "click") return To(e);
  }
  function RS(t, e) {
    if (t === "input" || t === "change")
      return To(e);
  }
  function HS(t, e) {
    return t === e && (t !== 0 || 1 / t === 1 / e) || t !== t && e !== e;
  }
  var qe = typeof Object.is == "function" ? Object.is : HS;
  function Fi(t, e) {
    if (qe(t, e)) return !0;
    if (typeof t != "object" || t === null || typeof e != "object" || e === null)
      return !1;
    var n = Object.keys(t), a = Object.keys(e);
    if (n.length !== a.length) return !1;
    for (a = 0; a < n.length; a++) {
      var u = n[a];
      if (!Ui.call(e, u) || !qe(t[u], e[u]))
        return !1;
    }
    return !0;
  }
  function ts(t) {
    if (t = t || (typeof document < "u" ? document : void 0), typeof t > "u") return null;
    try {
      return t.activeElement || t.body;
    } catch {
      return t.body;
    }
  }
  function Qh(t) {
    for (; t && t.firstChild; ) t = t.firstChild;
    return t;
  }
  function Kh(t, e) {
    var n = Qh(t);
    t = 0;
    for (var a; n; ) {
      if (n.nodeType === 3) {
        if (a = t + n.textContent.length, t <= e && a >= e)
          return { node: n, offset: e - t };
        t = a;
      }
      t: {
        for (; n; ) {
          if (n.nextSibling) {
            n = n.nextSibling;
            break t;
          }
          n = n.parentNode;
        }
        n = void 0;
      }
      n = Qh(n);
    }
  }
  function $h(t, e) {
    return t && e ? t === e ? !0 : t && t.nodeType === 3 ? !1 : e && e.nodeType === 3 ? $h(t, e.parentNode) : "contains" in t ? t.contains(e) : t.compareDocumentPosition ? !!(t.compareDocumentPosition(e) & 16) : !1 : !1;
  }
  function Jh(t) {
    t = t != null && t.ownerDocument != null && t.ownerDocument.defaultView != null ? t.ownerDocument.defaultView : window;
    for (var e = ts(t.document); e instanceof t.HTMLIFrameElement; ) {
      try {
        var n = typeof e.contentWindow.location.href == "string";
      } catch {
        n = !1;
      }
      if (n) t = e.contentWindow;
      else break;
      e = ts(t.document);
    }
    return e;
  }
  function es(t) {
    var e = t && t.nodeName && t.nodeName.toLowerCase();
    return e && (e === "input" && (t.type === "text" || t.type === "search" || t.type === "tel" || t.type === "url" || t.type === "password") || e === "textarea" || t.contentEditable === "true");
  }
  var US = Gn && "documentMode" in document && 11 >= document.documentMode, Va = null, ns = null, Wi = null, ls = !1;
  function Ih(t, e, n) {
    var a = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
    ls || Va == null || Va !== ts(a) || (a = Va, "selectionStart" in a && es(a) ? a = { start: a.selectionStart, end: a.selectionEnd } : (a = (a.ownerDocument && a.ownerDocument.defaultView || window).getSelection(), a = {
      anchorNode: a.anchorNode,
      anchorOffset: a.anchorOffset,
      focusNode: a.focusNode,
      focusOffset: a.focusOffset
    }), Wi && Fi(Wi, a) || (Wi = a, a = Tc(ns, "onSelect"), 0 < a.length && (e = new wo(
      "onSelect",
      "select",
      null,
      e,
      n
    ), t.push({ event: e, listeners: a }), e.target = Va)));
  }
  function Jl(t, e) {
    var n = {};
    return n[t.toLowerCase()] = e.toLowerCase(), n["Webkit" + t] = "webkit" + e, n["Moz" + t] = "moz" + e, n;
  }
  var La = {
    animationend: Jl("Animation", "AnimationEnd"),
    animationiteration: Jl("Animation", "AnimationIteration"),
    animationstart: Jl("Animation", "AnimationStart"),
    transitionrun: Jl("Transition", "TransitionRun"),
    transitionstart: Jl("Transition", "TransitionStart"),
    transitioncancel: Jl("Transition", "TransitionCancel"),
    transitionend: Jl("Transition", "TransitionEnd")
  }, as = {}, kh = {};
  Gn && (kh = document.createElement("div").style, "AnimationEvent" in window || (delete La.animationend.animation, delete La.animationiteration.animation, delete La.animationstart.animation), "TransitionEvent" in window || delete La.transitionend.transition);
  function Il(t) {
    if (as[t]) return as[t];
    if (!La[t]) return t;
    var e = La[t], n;
    for (n in e)
      if (e.hasOwnProperty(n) && n in kh)
        return as[t] = e[n];
    return t;
  }
  var Fh = Il("animationend"), Wh = Il("animationiteration"), Ph = Il("animationstart"), BS = Il("transitionrun"), YS = Il("transitionstart"), VS = Il("transitioncancel"), t0 = Il("transitionend"), e0 = /* @__PURE__ */ new Map(), is = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error fullscreenChange fullscreenError gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(
    " "
  );
  is.push("scrollEnd");
  function rn(t, e) {
    e0.set(t, e), cn(e, [t]);
  }
  var LS = 0;
  function Qn(t, e) {
    if (t.name != null && t.name !== "auto") return t.name;
    if (e.autoName !== null) return e.autoName;
    t = hn.identifierPrefix;
    var n = LS++;
    return t = "_" + t + "t_" + n.toString(32) + "_", e.autoName = t;
  }
  function n0(t) {
    if (t == null || typeof t == "string")
      return t;
    var e = null, n = ii;
    if (n !== null)
      for (var a = 0; a < n.length; a++) {
        var u = t[n[a]];
        if (u != null) {
          if (u === "none") return "none";
          e = e == null ? u : e + (" " + u);
        }
      }
    return e ?? t.default;
  }
  function Kn(t, e) {
    return t = n0(t), e = n0(e), e == null ? t === "auto" ? null : t : e === "auto" ? null : e;
  }
  var Mo = typeof reportError == "function" ? reportError : function(t) {
    if (typeof window == "object" && typeof window.ErrorEvent == "function") {
      var e = new window.ErrorEvent("error", {
        bubbles: !0,
        cancelable: !0,
        message: typeof t == "object" && t !== null && typeof t.message == "string" ? String(t.message) : String(t),
        error: t
      });
      if (!window.dispatchEvent(e)) return;
    } else if (typeof process == "object" && typeof process.emit == "function") {
      process.emit("uncaughtException", t);
      return;
    }
    console.error(t);
  }, We = [], qa = 0, us = 0;
  function zo() {
    for (var t = qa, e = us = qa = 0; e < t; ) {
      var n = We[e];
      We[e++] = null;
      var a = We[e];
      We[e++] = null;
      var u = We[e];
      We[e++] = null;
      var c = We[e];
      if (We[e++] = null, a !== null && u !== null) {
        var h = a.pending;
        h === null ? u.next = u : (u.next = h.next, h.next = u), a.pending = u;
      }
      c !== 0 && l0(n, u, c);
    }
  }
  function Co(t, e, n, a) {
    We[qa++] = t, We[qa++] = e, We[qa++] = n, We[qa++] = a, us |= a, t.lanes |= a, t = t.alternate, t !== null && (t.lanes |= a);
  }
  function os(t, e, n, a) {
    return Co(t, e, n, a), Ao(t);
  }
  function kl(t, e) {
    return Co(t, null, null, e), Ao(t);
  }
  function l0(t, e, n) {
    t.lanes |= n;
    var a = t.alternate;
    a !== null && (a.lanes |= n);
    for (var u = !1, c = t.return; c !== null; )
      c.childLanes |= n, a = c.alternate, a !== null && (a.childLanes |= n), c.tag === 22 && (t = c.stateNode, t === null || t._visibility & 1 || (u = !0)), t = c, c = c.return;
    return t.tag === 3 ? (c = t.stateNode, u && e !== null && (u = 31 - Te(n), t = c.hiddenUpdates, a = t[u], a === null ? t[u] = [e] : a.push(e), e.lane = n | 536870912), c) : null;
  }
  function Ao(t) {
    if (50 < xu)
      throw xu = 0, Sc = null, Error(r(185));
    for (var e = t.return; e !== null; )
      t = e, e = t.return;
    return t.tag === 3 ? t.stateNode : null;
  }
  var Xa = {};
  function qS(t, e, n, a) {
    this.tag = t, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = e, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = a, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
  }
  function Re(t, e, n, a) {
    return new qS(t, e, n, a);
  }
  function cs(t) {
    return t = t.prototype, !(!t || !t.isReactComponent);
  }
  function $n(t, e) {
    var n = t.alternate;
    return n === null ? (n = Re(
      t.tag,
      e,
      t.key,
      t.mode
    ), n.elementType = t.elementType, n.type = t.type, n.stateNode = t.stateNode, n.alternate = t, t.alternate = n) : (n.pendingProps = e, n.type = t.type, n.flags = 0, n.subtreeFlags = 0, n.deletions = null), n.flags = t.flags & 1206910976, n.childLanes = t.childLanes, n.lanes = t.lanes, n.child = t.child, n.memoizedProps = t.memoizedProps, n.memoizedState = t.memoizedState, n.updateQueue = t.updateQueue, e = t.dependencies, n.dependencies = e === null ? null : { lanes: e.lanes, firstContext: e.firstContext }, n.sibling = t.sibling, n.index = t.index, n.ref = t.ref, n.refCleanup = t.refCleanup, n;
  }
  function a0(t, e) {
    t.flags &= 1206910978;
    var n = t.alternate;
    return n === null ? (t.childLanes = 0, t.lanes = e, t.child = null, t.subtreeFlags = 0, t.memoizedProps = null, t.memoizedState = null, t.updateQueue = null, t.dependencies = null, t.stateNode = null) : (t.childLanes = n.childLanes, t.lanes = n.lanes, t.child = n.child, t.subtreeFlags = 0, t.deletions = null, t.memoizedProps = n.memoizedProps, t.memoizedState = n.memoizedState, t.updateQueue = n.updateQueue, t.type = n.type, e = n.dependencies, t.dependencies = e === null ? null : {
      lanes: e.lanes,
      firstContext: e.firstContext
    }), t;
  }
  function Oo(t, e, n, a, u, c) {
    var h = 0;
    if (a = t, typeof a == "function") cs(a) && (h = 1);
    else if (typeof a == "string")
      h = gb(
        t,
        n,
        Pt.current
      ) ? 26 : t === "html" || t === "head" || t === "body" ? 27 : 5;
    else
      t: switch (a) {
        case at:
          return t = Re(31, n, e, u), t.elementType = at, t.lanes = c, t;
        case tt:
          return Fl(n.children, u, c, e);
        case ot:
          h = 8, u |= 24;
          break;
        case lt:
          return t = Re(12, n, e, u | 2), t.elementType = lt, t.lanes = c, t;
        case H:
          return t = Re(13, n, e, u), t.elementType = H, t.lanes = c, t;
        case X:
          return t = Re(19, n, e, u), t.elementType = X, t.lanes = c, t;
        case dt:
        case T:
          return t = u | 32, t = Re(30, n, e, t), t.elementType = T, t.lanes = c, t.stateNode = {
            autoName: null,
            paired: null,
            clones: null,
            ref: null
          }, t;
        default:
          if (typeof a == "object" && a !== null)
            switch (a.$$typeof) {
              case V:
                h = 10;
                break t;
              case M:
                h = 9;
                break t;
              case O:
                h = 11;
                break t;
              case K:
                h = 14;
                break t;
              case F:
                h = 16, a = null;
                break t;
            }
          h = 29, n = Error(
            r(130, t === null ? "null" : typeof t, "")
          ), a = null;
      }
    return e = Re(h, n, e, u), e.elementType = t, e.type = a, e.lanes = c, e;
  }
  function Fl(t, e, n, a) {
    return t = Re(7, t, a, e), t.lanes = n, t;
  }
  function rs(t, e, n) {
    return t = Re(6, t, null, e), t.lanes = n, t;
  }
  function i0(t) {
    var e = Re(18, null, null, 0);
    return e.stateNode = t, e;
  }
  function ss(t, e, n) {
    return e = Re(
      4,
      t.children !== null ? t.children : [],
      t.key,
      e
    ), e.lanes = n, e.stateNode = {
      containerInfo: t.containerInfo,
      pendingChildren: null,
      implementation: t.implementation
    }, e;
  }
  var u0 = /* @__PURE__ */ new WeakMap();
  function Pe(t, e) {
    if (typeof t == "object" && t !== null) {
      var n = u0.get(t);
      return n !== void 0 ? n : (e = {
        value: t,
        source: e,
        stack: no(e)
      }, u0.set(t, e), e);
    }
    return {
      value: t,
      source: e,
      stack: no(e)
    };
  }
  var ja = [], Za = 0, Do = null, Pi = 0, tn = [], en = 0, dl = null, Tn = 1, Mn = "";
  function Jn(t, e) {
    ja[Za++] = Pi, ja[Za++] = Do, Do = t, Pi = e;
  }
  function o0(t, e, n) {
    tn[en++] = Tn, tn[en++] = Mn, tn[en++] = dl, dl = t;
    var a = Tn;
    t = Mn;
    var u = 32 - Te(a) - 1;
    a &= ~(1 << u), n += 1;
    var c = 32 - Te(e) + u;
    if (30 < c) {
      var h = u - u % 5;
      c = (a & (1 << h) - 1).toString(32), a >>= h, u -= h, Tn = 1 << 32 - Te(e) + u | n << u | a, Mn = c + t;
    } else
      Tn = 1 << c | n << u | a, Mn = t;
  }
  function Ro(t) {
    t.return !== null && (Jn(t, 1), o0(t, 1, 0));
  }
  function fs(t) {
    for (; t === Do; )
      Do = ja[--Za], ja[Za] = null, Pi = ja[--Za], ja[Za] = null;
    for (; t === dl; )
      dl = tn[--en], tn[en] = null, Mn = tn[--en], tn[en] = null, Tn = tn[--en], tn[en] = null;
  }
  function c0(t, e) {
    tn[en++] = Tn, tn[en++] = Mn, tn[en++] = dl, Tn = e.id, Mn = e.overflow, dl = t;
  }
  var se = null, Qt = null, zt = !1, hl = null, nn = !1, ds = Error(r(519));
  function gl(t) {
    var e = Error(
      r(
        418,
        1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML",
        ""
      )
    );
    throw tu(Pe(e, t)), ds;
  }
  function r0(t) {
    var e = t.stateNode, n = t.type, a = t.memoizedProps;
    switch (e[oe] = t, e[be] = a, n) {
      case "dialog":
        At("cancel", e), At("close", e);
        break;
      case "iframe":
      case "object":
      case "embed":
        At("load", e);
        break;
      case "video":
      case "audio":
        for (n = 0; n < Eu.length; n++)
          At(Eu[n], e);
        break;
      case "source":
        At("error", e);
        break;
      case "img":
      case "image":
      case "link":
        At("error", e), At("load", e);
        break;
      case "details":
        At("toggle", e);
        break;
      case "input":
        At("invalid", e), bh(
          e,
          a.value,
          a.defaultValue,
          a.checked,
          a.defaultChecked,
          a.type,
          a.name,
          !0
        );
        break;
      case "select":
        At("invalid", e);
        break;
      case "textarea":
        At("invalid", e), _h(e, a.value, a.defaultValue, a.children);
    }
    n = a.children, typeof n != "string" && typeof n != "number" && typeof n != "bigint" || e.textContent === "" + n || a.suppressHydrationWarning === !0 || Am(e.textContent, n) ? (a.popover != null && (At("beforetoggle", e), At("toggle", e)), a.onScroll != null && At("scroll", e), a.onScrollEnd != null && At("scrollend", e), a.onClick != null && (e.onclick = Nn), e = !0) : e = !1, e || gl(t, !0);
  }
  function Ho(t) {
    for (se = t.return; se; )
      switch (se.tag) {
        case 5:
        case 31:
        case 13:
          nn = !1;
          return;
        case 27:
        case 3:
          nn = !0;
          return;
        default:
          se = se.return;
      }
  }
  function Ga(t) {
    if (t !== se) return !1;
    if (!zt) return Ho(t), zt = !0, !1;
    var e = t.tag, n;
    if ((n = e !== 3 && e !== 27) && ((n = e === 5) && (n = t.type, n = !(n !== "form" && n !== "button") || Zf(t.type, t.memoizedProps)), n = !n), n && Qt && gl(t), Ho(t), e === 13) {
      if (t = t.memoizedState, t = t !== null ? t.dehydrated : null, !t) throw Error(r(317));
      Qt = Im(t);
    } else if (e === 31) {
      if (t = t.memoizedState, t = t !== null ? t.dehydrated : null, !t) throw Error(r(317));
      Qt = Im(t);
    } else
      e === 27 ? (e = Qt, Al(t.type) ? (t = Wf, Wf = null, Qt = t) : Qt = e) : Qt = se ? an(t.stateNode.nextSibling) : null;
    return !0;
  }
  function Wl() {
    Qt = se = null, zt = !1;
  }
  function hs() {
    var t = hl;
    return t !== null && (Be === null ? Be = t : Be.push.apply(
      Be,
      t
    ), hl = null), t;
  }
  function tu(t) {
    hl === null ? hl = [t] : hl.push(t);
  }
  var gs = Mt(null), Pl = null, In = null;
  function ml(t, e, n) {
    Ot(gs, e._currentValue), e._currentValue = n;
  }
  function kn(t) {
    t._currentValue = gs.current, Ht(gs);
  }
  function Uo(t, e, n) {
    for (; t !== null; ) {
      var a = t.alternate;
      if ((t.childLanes & e) !== e ? (t.childLanes |= e, a !== null && (a.childLanes |= e)) : a !== null && (a.childLanes & e) !== e && (a.childLanes |= e), t === n) break;
      t = t.return;
    }
  }
  function ms(t, e, n, a) {
    var u = t.child;
    for (u !== null && (u.return = t); u !== null; ) {
      var c = u.dependencies;
      if (c !== null) {
        var h = u.child;
        c = c.firstContext;
        t: for (; c !== null; ) {
          var x = c;
          c = u;
          for (var z = 0; z < e.length; z++)
            if (x.context === e[z]) {
              c.lanes |= n, x = c.alternate, x !== null && (x.lanes |= n), Uo(
                c.return,
                n,
                t
              ), a || (h = null);
              break t;
            }
          c = x.next;
        }
      } else if (u.tag === 18) {
        if (h = u.return, h === null) throw Error(r(341));
        h.lanes |= n, c = h.alternate, c !== null && (c.lanes |= n), Uo(h, n, t), h = null;
      } else
        u.tag === 13 && u.memoizedState !== null && u.memoizedState.dehydrated === null ? (u.lanes |= n, h = u.alternate, h !== null && (h.lanes |= n), Uo(
          u.return,
          n,
          t
        ), h = u.child, h = h !== null ? h.sibling : null) : h = u.child;
      if (h !== null) h.return = u;
      else
        for (h = u; h !== null; ) {
          if (h === t) {
            h = null;
            break;
          }
          if (u = h.sibling, u !== null) {
            u.return = h.return, h = u;
            break;
          }
          h = h.return;
        }
      u = h;
    }
  }
  function ta(t, e, n, a) {
    t = null;
    for (var u = e, c = !1; u !== null; ) {
      if (!c) {
        if ((u.flags & 524288) !== 0) c = !0;
        else if ((u.flags & 262144) !== 0) break;
      }
      if (u.tag === 10) {
        var h = u.alternate;
        if (h === null) throw Error(r(387));
        if (h = h.memoizedProps, h !== null) {
          var x = u.type;
          qe(u.pendingProps.value, h.value) || (t !== null ? t.push(x) : t = [x]);
        }
      } else if (u === En.current) {
        if (h = u.alternate, h === null) throw Error(r(387));
        h.memoizedState.memoizedState !== u.memoizedState.memoizedState && (t !== null ? t.push(mi) : t = [mi]);
      }
      u = u.return;
    }
    return t !== null && ms(
      e,
      t,
      n,
      a
    ), e.flags |= 262144, t !== null;
  }
  function Bo(t) {
    for (t = t.firstContext; t !== null; ) {
      if (!qe(
        t.context._currentValue,
        t.memoizedValue
      ))
        return !0;
      t = t.next;
    }
    return !1;
  }
  function ea(t) {
    Pl = t, In = null, t = t.dependencies, t !== null && (t.firstContext = null);
  }
  function ge(t) {
    return s0(Pl, t);
  }
  function Yo(t, e) {
    return Pl === null && ea(t), s0(t, e);
  }
  function s0(t, e) {
    var n = e._currentValue;
    if (e = { context: e, memoizedValue: n, next: null }, In === null) {
      if (t === null) throw Error(r(308));
      In = e, t.dependencies = { lanes: 0, firstContext: e }, t.flags |= 524288;
    } else In = In.next = e;
    return n;
  }
  var XS = typeof AbortController < "u" ? AbortController : function() {
    var t = [], e = this.signal = {
      aborted: !1,
      addEventListener: function(n, a) {
        t.push(a);
      }
    };
    this.abort = function() {
      e.aborted = !0, t.forEach(function(n) {
        return n();
      });
    };
  }, jS = l.unstable_scheduleCallback, ZS = l.unstable_NormalPriority, ne = {
    $$typeof: V,
    Consumer: null,
    Provider: null,
    _currentValue: null,
    _currentValue2: null,
    _threadCount: 0
  };
  function ys() {
    return {
      controller: new XS(),
      data: /* @__PURE__ */ new Map(),
      refCount: 0
    };
  }
  function eu(t) {
    t.refCount--, t.refCount === 0 && jS(ZS, function() {
      t.controller.abort();
    });
  }
  function f0(t, e) {
    if ((t.pendingLanes & 4194048) !== 0) {
      var n = t.transitionTypes;
      for (n === null && (n = t.transitionTypes = []), t = 0; t < e.length; t++) {
        var a = e[t];
        n.indexOf(a) === -1 && n.push(a);
      }
    }
  }
  var nu = null;
  function GS(t) {
    var e = t.transitionTypes;
    return t.transitionTypes = null, e;
  }
  var lu = null, vs = 0, na = 0, Qa = null;
  function QS(t, e) {
    if (lu === null) {
      var n = lu = [];
      vs = 0, na = Hf(), Qa = {
        status: "pending",
        value: void 0,
        then: function(a) {
          n.push(a);
        }
      };
    }
    return vs++, e.then(d0, d0), e;
  }
  function d0() {
    if (--vs === 0 && (nu = null, lu !== null)) {
      Qa !== null && (Qa.status = "fulfilled");
      var t = lu;
      lu = null, na = 0, Qa = null;
      for (var e = 0; e < t.length; e++) (0, t[e])();
    }
  }
  function KS(t, e) {
    var n = [], a = {
      status: "pending",
      value: null,
      reason: null,
      then: function(u) {
        n.push(u);
      }
    };
    return t.then(
      function() {
        a.status = "fulfilled", a.value = e;
        for (var u = 0; u < n.length; u++) (0, n[u])(e);
      },
      function(u) {
        for (a.status = "rejected", a.reason = u, u = 0; u < n.length; u++)
          (0, n[u])(void 0);
      }
    ), a;
  }
  var h0 = ct.S;
  ct.S = function(t, e) {
    if (im = we(), typeof e == "object" && e !== null && typeof e.then == "function" && QS(t, e), nu !== null)
      for (var n = ri; n !== null; )
        f0(n, nu), n = n.next;
    if (n = t.types, n !== null) {
      for (var a = ri; a !== null; )
        f0(a, n), a = a.next;
      if (na !== 0) {
        a = nu, a === null && (a = nu = []);
        for (var u = 0; u < n.length; u++) {
          var c = n[u];
          a.indexOf(c) === -1 && a.push(c);
        }
      }
    }
    h0 !== null && h0(t, e);
  };
  var la = Mt(null);
  function ps() {
    var t = la.current;
    return t !== null ? t : Gt.pooledCache;
  }
  function Vo(t, e) {
    e === null ? Ot(la, la.current) : Ot(la, e.pool);
  }
  function g0() {
    var t = ps();
    return t === null ? null : { parent: ne._currentValue, pool: t };
  }
  var Ka = Error(r(460)), Ss = Error(r(474)), Lo = Error(r(542)), qo = { then: function() {
  } };
  function m0(t) {
    return t = t.status, t === "fulfilled" || t === "rejected";
  }
  function y0(t, e, n) {
    switch (n = t[n], n === void 0 ? t.push(e) : n !== e && (e.then(Nn, Nn), e = n), e.status) {
      case "fulfilled":
        return e.value;
      case "rejected":
        throw t = e.reason, p0(t), t === void 0 && !("reason" in e) ? Error(r(600)) : t;
      default:
        if (typeof e.status == "string") e.then(Nn, Nn);
        else {
          if (t = Gt, t !== null && 100 < t.shellSuspendCounter)
            throw Error(r(482));
          t = e, t.status = "pending", t.then(
            function(a) {
              if (e.status === "pending") {
                var u = e;
                u.status = "fulfilled", u.value = a;
              }
            },
            function(a) {
              if (e.status === "pending") {
                var u = e;
                u.status = "rejected", u.reason = a;
              }
            }
          );
        }
        switch (e.status) {
          case "fulfilled":
            return e.value;
          case "rejected":
            throw t = e.reason, p0(t), t;
        }
        throw ia = e, Ka;
    }
  }
  function aa(t) {
    try {
      var e = t._init;
      return e(t._payload);
    } catch (n) {
      throw n !== null && typeof n == "object" && typeof n.then == "function" ? (ia = n, Ka) : n;
    }
  }
  var ia = null;
  function v0() {
    if (ia === null) throw Error(r(459));
    var t = ia;
    return ia = null, t;
  }
  function p0(t) {
    if (t === Ka || t === Lo)
      throw Error(r(483));
  }
  var $a = null, au = 0;
  function Xo(t) {
    var e = au;
    return au += 1, $a === null && ($a = []), y0($a, t, e);
  }
  function yl(t, e) {
    e = e.props.ref, t.ref = e !== void 0 ? e : null;
  }
  function jo(t, e) {
    throw e.$$typeof === Z ? Error(r(525)) : (t = Object.prototype.toString.call(e), Error(
      r(
        31,
        t === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : t
      )
    ));
  }
  function S0(t) {
    function e(L, D) {
      if (t) {
        var G = L.deletions;
        G === null ? (L.deletions = [D], L.flags |= 16) : G.push(D);
      }
    }
    function n(L, D) {
      if (!t) return null;
      for (; D !== null; )
        e(L, D), D = D.sibling;
      return null;
    }
    function a(L) {
      for (var D = /* @__PURE__ */ new Map(); L !== null; )
        L.key === null ? D.set(L.index, L) : D.set(L.key, L), L = L.sibling;
      return D;
    }
    function u(L, D) {
      return L = $n(L, D), L.index = 0, L.sibling = null, L;
    }
    function c(L, D, G) {
      return L.index = G, t ? (G = L.alternate, G !== null ? (G = G.index, G < D ? (L.flags |= 2, D) : G) : (L.flags |= 134217730, D)) : (L.flags |= 1048576, D);
    }
    function h(L) {
      return t && L.alternate === null && (L.flags |= 134217730), L;
    }
    function x(L, D, G, et) {
      return D === null || D.tag !== 6 ? (D = rs(G, L.mode, et), D.return = L, D) : (D = u(D, G), D.return = L, D);
    }
    function z(L, D, G, et) {
      var mt = G.type;
      return mt === tt ? (L = $(
        L,
        D,
        G.props.children,
        et,
        G.key
      ), yl(L, G), L) : D !== null && (D.elementType === mt || typeof mt == "object" && mt !== null && mt.$$typeof === F && aa(mt) === D.type) ? (D = u(D, G.props), yl(D, G), D.return = L, D) : (D = Oo(
        G.type,
        G.key,
        G.props,
        null,
        L.mode,
        et
      ), yl(D, G), D.return = L, D);
    }
    function q(L, D, G, et) {
      return D === null || D.tag !== 4 || D.stateNode.containerInfo !== G.containerInfo || D.stateNode.implementation !== G.implementation ? (D = ss(G, L.mode, et), D.return = L, D) : (D = u(D, G.children || []), D.return = L, D);
    }
    function $(L, D, G, et, mt) {
      return D === null || D.tag !== 7 ? (D = Fl(
        G,
        L.mode,
        et,
        mt
      ), D.return = L, D) : (D = u(D, G), D.return = L, D);
    }
    function nt(L, D, G) {
      if (typeof D == "string" && D !== "" || typeof D == "number" || typeof D == "bigint")
        return D = rs(
          "" + D,
          L.mode,
          G
        ), D.return = L, D;
      if (typeof D == "object" && D !== null) {
        switch (D.$$typeof) {
          case J:
            return G = Oo(
              D.type,
              D.key,
              D.props,
              null,
              L.mode,
              G
            ), yl(G, D), G.return = L, G;
          case it:
            return D = ss(
              D,
              L.mode,
              G
            ), D.return = L, D;
          case F:
            return D = aa(D), nt(L, D, G);
        }
        if (gt(D) || ut(D))
          return D = Fl(
            D,
            L.mode,
            G,
            null
          ), D.return = L, D;
        if (typeof D.then == "function")
          return nt(L, Xo(D), G);
        if (D.$$typeof === V)
          return nt(
            L,
            Yo(L, D),
            G
          );
        jo(L, D);
      }
      return null;
    }
    function Y(L, D, G, et) {
      var mt = D !== null ? D.key : null;
      if (typeof G == "string" && G !== "" || typeof G == "number" || typeof G == "bigint")
        return mt !== null ? null : x(L, D, "" + G, et);
      if (typeof G == "object" && G !== null) {
        switch (G.$$typeof) {
          case J:
            return G.key === mt ? z(L, D, G, et) : null;
          case it:
            return G.key === mt ? q(L, D, G, et) : null;
          case F:
            return G = aa(G), Y(L, D, G, et);
        }
        if (gt(G) || ut(G))
          return mt !== null ? null : $(L, D, G, et, null);
        if (typeof G.then == "function")
          return Y(
            L,
            D,
            Xo(G),
            et
          );
        if (G.$$typeof === V)
          return Y(
            L,
            D,
            Yo(L, G),
            et
          );
        jo(L, G);
      }
      return null;
    }
    function Q(L, D, G, et, mt) {
      if (typeof et == "string" && et !== "" || typeof et == "number" || typeof et == "bigint")
        return L = L.get(G) || null, x(D, L, "" + et, mt);
      if (typeof et == "object" && et !== null) {
        switch (et.$$typeof) {
          case J:
            return L = L.get(
              et.key === null ? G : et.key
            ) || null, z(D, L, et, mt);
          case it:
            return L = L.get(
              et.key === null ? G : et.key
            ) || null, q(D, L, et, mt);
          case F:
            return et = aa(et), Q(
              L,
              D,
              G,
              et,
              mt
            );
        }
        if (gt(et) || ut(et))
          return L = L.get(G) || null, $(D, L, et, mt, null);
        if (typeof et.then == "function")
          return Q(
            L,
            D,
            G,
            Xo(et),
            mt
          );
        if (et.$$typeof === V)
          return Q(
            L,
            D,
            G,
            Yo(D, et),
            mt
          );
        jo(D, et);
      }
      return null;
    }
    function ht(L, D, G, et) {
      for (var mt = null, Rt = null, St = D, bt = D = 0, ie = null; St !== null && bt < G.length; bt++) {
        St.index > bt ? (ie = St, St = null) : ie = St.sibling;
        var Ut = Y(
          L,
          St,
          G[bt],
          et
        );
        if (Ut === null) {
          St === null && (St = ie);
          break;
        }
        t && St && Ut.alternate === null && e(L, St), D = c(Ut, D, bt), Rt === null ? mt = Ut : Rt.sibling = Ut, Rt = Ut, St = ie;
      }
      if (bt === G.length)
        return n(L, St), zt && Jn(L, bt), mt;
      if (St === null) {
        for (; bt < G.length; bt++)
          St = nt(L, G[bt], et), St !== null && (D = c(
            St,
            D,
            bt
          ), Rt === null ? mt = St : Rt.sibling = St, Rt = St);
        return zt && Jn(L, bt), mt;
      }
      for (St = a(St); bt < G.length; bt++)
        ie = Q(
          St,
          L,
          bt,
          G[bt],
          et
        ), ie !== null && (t && (Ut = ie.alternate, Ut !== null && St.delete(Ut.key === null ? bt : Ut.key)), D = c(
          ie,
          D,
          bt
        ), Rt === null ? mt = ie : Rt.sibling = ie, Rt = ie);
      return t && St.forEach(function(Ul) {
        return e(L, Ul);
      }), zt && Jn(L, bt), mt;
    }
    function yt(L, D, G, et) {
      if (G == null) throw Error(r(151));
      for (var mt = null, Rt = null, St = D, bt = D = 0, ie = null, Ut = G.next(); St !== null && !Ut.done; bt++, Ut = G.next()) {
        St.index > bt ? (ie = St, St = null) : ie = St.sibling;
        var Ul = Y(L, St, Ut.value, et);
        if (Ul === null) {
          St === null && (St = ie);
          break;
        }
        t && St && Ul.alternate === null && e(L, St), D = c(Ul, D, bt), Rt === null ? mt = Ul : Rt.sibling = Ul, Rt = Ul, St = ie;
      }
      if (Ut.done)
        return n(L, St), zt && Jn(L, bt), mt;
      if (St === null) {
        for (; !Ut.done; bt++, Ut = G.next())
          Ut = nt(L, Ut.value, et), Ut !== null && (D = c(Ut, D, bt), Rt === null ? mt = Ut : Rt.sibling = Ut, Rt = Ut);
        return zt && Jn(L, bt), mt;
      }
      for (St = a(St); !Ut.done; bt++, Ut = G.next())
        Ut = Q(St, L, bt, Ut.value, et), Ut !== null && (t && (ie = Ut.alternate, ie !== null && St.delete(
          ie.key === null ? bt : ie.key
        )), D = c(Ut, D, bt), Rt === null ? mt = Ut : Rt.sibling = Ut, Rt = Ut);
      return t && St.forEach(function(Tb) {
        return e(L, Tb);
      }), zt && Jn(L, bt), mt;
    }
    function Tt(L, D, G, et) {
      if (typeof G == "object" && G !== null && G.type === tt && G.key === null && G.props.ref === void 0 && (G = G.props.children), typeof G == "object" && G !== null) {
        switch (G.$$typeof) {
          case J:
            t: {
              for (var mt = G.key; D !== null; ) {
                if (D.key === mt) {
                  if (mt = G.type, mt === tt) {
                    if (D.tag === 7) {
                      n(
                        L,
                        D.sibling
                      ), et = u(
                        D,
                        G.props.children
                      ), yl(et, G), et.return = L, L = et;
                      break t;
                    }
                  } else if (D.elementType === mt || typeof mt == "object" && mt !== null && mt.$$typeof === F && aa(mt) === D.type) {
                    n(
                      L,
                      D.sibling
                    ), et = u(D, G.props), yl(et, G), et.return = L, L = et;
                    break t;
                  }
                  n(L, D);
                  break;
                } else e(L, D);
                D = D.sibling;
              }
              G.type === tt ? (et = Fl(
                G.props.children,
                L.mode,
                et,
                G.key
              ), yl(et, G), et.return = L, L = et) : (et = Oo(
                G.type,
                G.key,
                G.props,
                null,
                L.mode,
                et
              ), yl(et, G), et.return = L, L = et);
            }
            return h(L);
          case it:
            t: {
              for (mt = G.key; D !== null; ) {
                if (D.key === mt)
                  if (D.tag === 4 && D.stateNode.containerInfo === G.containerInfo && D.stateNode.implementation === G.implementation) {
                    n(
                      L,
                      D.sibling
                    ), et = u(D, G.children || []), et.return = L, L = et;
                    break t;
                  } else {
                    n(L, D);
                    break;
                  }
                else e(L, D);
                D = D.sibling;
              }
              et = ss(G, L.mode, et), et.return = L, L = et;
            }
            return h(L);
          case F:
            return G = aa(G), Tt(
              L,
              D,
              G,
              et
            );
        }
        if (gt(G))
          return ht(
            L,
            D,
            G,
            et
          );
        if (ut(G)) {
          if (mt = ut(G), typeof mt != "function") throw Error(r(150));
          return G = mt.call(G), yt(
            L,
            D,
            G,
            et
          );
        }
        if (typeof G.then == "function")
          return Tt(
            L,
            D,
            Xo(G),
            et
          );
        if (G.$$typeof === V)
          return Tt(
            L,
            D,
            Yo(L, G),
            et
          );
        jo(L, G);
      }
      return typeof G == "string" && G !== "" || typeof G == "number" || typeof G == "bigint" ? (G = "" + G, D !== null && D.tag === 6 ? (n(L, D.sibling), et = u(D, G), et.return = L, L = et) : (n(L, D), et = rs(G, L.mode, et), et.return = L, L = et), h(L)) : n(L, D);
    }
    return function(L, D, G, et) {
      try {
        au = 0;
        var mt = Tt(
          L,
          D,
          G,
          et
        );
        return $a = null, mt;
      } catch (St) {
        if (St === Ka || St === Lo) throw St;
        var Rt = Re(29, St, null, L.mode);
        return Rt.lanes = et, Rt.return = L, Rt;
      }
    };
  }
  var ua = S0(!0), x0 = S0(!1), vl = !1;
  function xs(t) {
    t.updateQueue = {
      baseState: t.memoizedState,
      firstBaseUpdate: null,
      lastBaseUpdate: null,
      shared: { pending: null, lanes: 0, hiddenCallbacks: null },
      callbacks: null
    };
  }
  function bs(t, e) {
    t = t.updateQueue, e.updateQueue === t && (e.updateQueue = {
      baseState: t.baseState,
      firstBaseUpdate: t.firstBaseUpdate,
      lastBaseUpdate: t.lastBaseUpdate,
      shared: t.shared,
      callbacks: null
    });
  }
  function pl(t) {
    return { lane: t, tag: 0, payload: null, callback: null, next: null };
  }
  function Sl(t, e, n) {
    var a = t.updateQueue;
    if (a === null) return null;
    if (a = a.shared, (Vt & 2) !== 0) {
      var u = a.pending;
      return u === null ? e.next = e : (e.next = u.next, u.next = e), a.pending = e, e = Ao(t), l0(t, null, n), e;
    }
    return Co(t, a, e, n), Ao(t);
  }
  function iu(t, e, n) {
    if (e = e.updateQueue, e !== null && (e = e.shared, (n & 4194048) !== 0)) {
      var a = e.lanes;
      a &= t.pendingLanes, n |= a, e.lanes = n, co(t, n);
    }
  }
  function Es(t, e) {
    var n = t.updateQueue, a = t.alternate;
    if (a !== null && (a = a.updateQueue, n === a)) {
      var u = null, c = null;
      if (n = n.firstBaseUpdate, n !== null) {
        do {
          var h = {
            lane: n.lane,
            tag: n.tag,
            payload: n.payload,
            callback: null,
            next: null
          };
          c === null ? u = c = h : c = c.next = h, n = n.next;
        } while (n !== null);
        c === null ? u = c = e : c = c.next = e;
      } else u = c = e;
      n = {
        baseState: a.baseState,
        firstBaseUpdate: u,
        lastBaseUpdate: c,
        shared: a.shared,
        callbacks: a.callbacks
      }, t.updateQueue = n;
      return;
    }
    t = n.lastBaseUpdate, t === null ? n.firstBaseUpdate = e : t.next = e, n.lastBaseUpdate = e;
  }
  var _s = !1;
  function uu() {
    if (_s) {
      var t = Qa;
      if (t !== null) throw t;
    }
  }
  function ou(t, e, n, a) {
    _s = !1;
    var u = t.updateQueue;
    vl = !1;
    var c = u.firstBaseUpdate, h = u.lastBaseUpdate, x = u.shared.pending;
    if (x !== null) {
      u.shared.pending = null;
      var z = x, q = z.next;
      z.next = null, h === null ? c = q : h.next = q, h = z;
      var $ = t.alternate;
      $ !== null && ($ = $.updateQueue, x = $.lastBaseUpdate, x !== h && (x === null ? $.firstBaseUpdate = q : x.next = q, $.lastBaseUpdate = z));
    }
    if (c !== null) {
      var nt = u.baseState;
      h = 0, $ = q = z = null, x = c;
      do {
        var Y = x.lane & -536870913, Q = Y !== x.lane;
        if (Q ? (Dt & Y) === Y : (a & Y) === Y) {
          Y !== 0 && Y === na && (_s = !0), $ !== null && ($ = $.next = {
            lane: 0,
            tag: x.tag,
            payload: x.payload,
            callback: null,
            next: null
          });
          t: {
            var ht = t, yt = x;
            Y = e;
            var Tt = n;
            switch (yt.tag) {
              case 1:
                if (ht = yt.payload, typeof ht == "function") {
                  nt = ht.call(Tt, nt, Y);
                  break t;
                }
                nt = ht;
                break t;
              case 3:
                ht.flags = ht.flags & -65537 | 128;
              case 0:
                if (ht = yt.payload, Y = typeof ht == "function" ? ht.call(Tt, nt, Y) : ht, Y == null) break t;
                nt = R({}, nt, Y);
                break t;
              case 2:
                vl = !0;
            }
          }
          Y = x.callback, Y !== null && (t.flags |= 64, Q && (t.flags |= 8192), Q = u.callbacks, Q === null ? u.callbacks = [Y] : Q.push(Y));
        } else
          Q = {
            lane: Y,
            tag: x.tag,
            payload: x.payload,
            callback: x.callback,
            next: null
          }, $ === null ? (q = $ = Q, z = nt) : $ = $.next = Q, h |= Y;
        if (x = x.next, x === null) {
          if (x = u.shared.pending, x === null)
            break;
          Q = x, x = Q.next, Q.next = null, u.lastBaseUpdate = Q, u.shared.pending = null;
        }
      } while (!0);
      $ === null && (z = nt), u.baseState = z, u.firstBaseUpdate = q, u.lastBaseUpdate = $, c === null && (u.shared.lanes = 0), Tl |= h, t.lanes = h, t.memoizedState = nt;
    }
  }
  function b0(t, e) {
    if (typeof t != "function")
      throw Error(r(191, t));
    t.call(e);
  }
  function E0(t, e) {
    var n = t.callbacks;
    if (n !== null)
      for (t.callbacks = null, t = 0; t < n.length; t++)
        b0(n[t], e);
  }
  var xl = Mt(null), Zo = Mt(0);
  function _0(t, e) {
    t = el, Ot(Zo, t), Ot(xl, e), el = t | e.baseLanes;
  }
  function ws() {
    Ot(Zo, el), Ot(xl, xl.current);
  }
  function Ns() {
    el = Zo.current, Ht(xl), Ht(Zo);
  }
  var me = Mt(null), Ee = null;
  function bl(t) {
    var e = t.alternate;
    Ot(ye, ye.current & 1), Ot(me, t), Ee === null && (e === null || xl.current !== null || e.memoizedState !== null) && (Ee = t);
  }
  function Ts(t) {
    Ot(ye, ye.current), Ot(me, t), Ee === null && (Ee = t);
  }
  function w0(t) {
    t.tag === 22 ? (Ot(ye, ye.current), Ot(me, t), Ee === null && (Ee = t)) : El();
  }
  function El() {
    Ot(ye, ye.current), Ot(me, me.current);
  }
  function Xe(t) {
    Ht(me), Ee === t && (Ee = null), Ht(ye);
  }
  var ye = Mt(0);
  function cu(t, e) {
    Ot(me, me.current), Ot(ye, e);
  }
  function Ms(t) {
    Ht(ye), Ht(me), Ee === t && (Ee = null);
  }
  function Go(t) {
    for (var e = t; e !== null; ) {
      if (e.tag === 13) {
        var n = e.memoizedState;
        if (n !== null && (n = n.dehydrated, n === null || kf(n) || Ff(n)))
          return e;
      } else if (e.tag === 19 && e.memoizedProps.revealOrder !== "independent") {
        if ((e.flags & 128) !== 0) return e;
      } else if (e.child !== null) {
        e.child.return = e, e = e.child;
        continue;
      }
      if (e === t) break;
      for (; e.sibling === null; ) {
        if (e.return === null || e.return === t) return null;
        e = e.return;
      }
      e.sibling.return = e.return, e = e.sibling;
    }
    return null;
  }
  var Fn = 0, Nt = null, Zt = null, le = null, Qo = !1, Ja = !1, oa = !1, Ko = 0, ru = 0, Ia = null, $S = 0;
  function Ft() {
    throw Error(r(321));
  }
  function zs(t, e) {
    if (e === null) return !1;
    for (var n = 0; n < e.length && n < t.length; n++)
      if (!qe(t[n], e[n])) return !1;
    return !0;
  }
  function Cs(t, e, n, a, u, c) {
    return Fn = c, Nt = e, e.memoizedState = null, e.updateQueue = null, e.lanes = 0, ct.H = t === null || t.memoizedState === null ? og : cg, oa = !1, c = n(a, u), oa = !1, Ja && (c = T0(
      e,
      n,
      a,
      u
    )), N0(t), c;
  }
  function N0(t) {
    ct.H = Po;
    var e = Zt !== null && Zt.next !== null;
    if (Fn = 0, le = Zt = Nt = null, Qo = !1, ru = 0, Ia = null, e) throw Error(r(300));
    t === null || ae || (t = t.dependencies, t !== null && Bo(t) && (ae = !0));
  }
  function T0(t, e, n, a) {
    Nt = t;
    var u = 0;
    do {
      if (Ja && (Ia = null), ru = 0, Ja = !1, 25 <= u) throw Error(r(301));
      if (u += 1, le = Zt = null, t.updateQueue != null) {
        var c = t.updateQueue;
        c.lastEffect = null, c.events = null, c.stores = null, c.memoCache != null && (c.memoCache.index = 0);
      }
      ct.H = ex, c = e(n, a);
    } while (Ja);
    return c;
  }
  function JS() {
    var t = ct.H, e = t.useState()[0];
    return e = typeof e.then == "function" ? su(e) : e, t = t.useState()[0], (Zt !== null ? Zt.memoizedState : null) !== t && (Nt.flags |= 1024), e;
  }
  function As() {
    var t = Ko !== 0;
    return Ko = 0, t;
  }
  function Os(t, e, n) {
    e.updateQueue = t.updateQueue, e.flags &= -2053, t.lanes &= ~n;
  }
  function Ds(t) {
    if (Qo) {
      for (t = t.memoizedState; t !== null; ) {
        var e = t.queue;
        e !== null && (e.pending = null), t = t.next;
      }
      Qo = !1;
    }
    Fn = 0, le = Zt = Nt = null, Ja = !1, ru = Ko = 0, Ia = null;
  }
  function ze() {
    var t = {
      memoizedState: null,
      baseState: null,
      baseQueue: null,
      queue: null,
      next: null
    };
    return le === null ? Nt.memoizedState = le = t : le = le.next = t, le;
  }
  function te() {
    if (Zt === null) {
      var t = Nt.alternate;
      t = t !== null ? t.memoizedState : null;
    } else t = Zt.next;
    var e = le === null ? Nt.memoizedState : le.next;
    if (e !== null)
      le = e, Zt = t;
    else {
      if (t === null)
        throw Nt.alternate === null ? Error(r(467)) : Error(r(310));
      Zt = t, t = {
        memoizedState: Zt.memoizedState,
        baseState: Zt.baseState,
        baseQueue: Zt.baseQueue,
        queue: Zt.queue,
        next: null
      }, le === null ? Nt.memoizedState = le = t : le = le.next = t;
    }
    return le;
  }
  function $o() {
    return { lastEffect: null, events: null, stores: null, memoCache: null };
  }
  function su(t) {
    var e = ru;
    return ru += 1, Ia === null && (Ia = []), t = y0(Ia, t, e), e = Nt, (le === null ? e.memoizedState : le.next) === null && (e = e.alternate, ct.H = e === null || e.memoizedState === null ? og : cg), t;
  }
  function Jo(t) {
    if (t !== null && typeof t == "object") {
      if (typeof t.then == "function") return su(t);
      if (t.$$typeof === k) return;
      if (t.$$typeof === V) return ge(t);
    }
    throw Error(r(438, String(t)));
  }
  function Rs(t) {
    var e = null, n = Nt.updateQueue;
    if (n !== null && (e = n.memoCache), e == null) {
      var a = Nt.alternate;
      a !== null && (a = a.updateQueue, a !== null && (a = a.memoCache, a != null && (e = {
        data: a.data.map(function(u) {
          return u.slice();
        }),
        index: 0
      })));
    }
    if (e == null && (e = { data: [], index: 0 }), n === null && (n = $o(), Nt.updateQueue = n), n.memoCache = e, n = e.data[e.index], n === void 0)
      for (n = e.data[e.index] = Array(t), a = 0; a < t; a++)
        n[a] = pt;
    return e.index++, n;
  }
  function Wn(t, e) {
    return typeof e == "function" ? e(t) : e;
  }
  function Io(t) {
    var e = te();
    return Hs(e, Zt, t);
  }
  function Hs(t, e, n) {
    var a = t.queue;
    if (a === null) throw Error(r(311));
    a.lastRenderedReducer = n;
    var u = t.baseQueue, c = a.pending;
    if (c !== null) {
      if (u !== null) {
        var h = u.next;
        u.next = c.next, c.next = h;
      }
      e.baseQueue = u = c, a.pending = null;
    }
    if (c = t.baseState, u === null) t.memoizedState = c;
    else {
      e = u.next;
      var x = h = null, z = null, q = e, $ = !1;
      do {
        var nt = q.lane & -536870913;
        if (nt !== q.lane ? (Dt & nt) === nt : (Fn & nt) === nt) {
          var Y = q.revertLane;
          if (Y === 0)
            z !== null && (z = z.next = {
              lane: 0,
              revertLane: 0,
              gesture: null,
              action: q.action,
              hasEagerState: q.hasEagerState,
              eagerState: q.eagerState,
              next: null
            }), nt === na && ($ = !0);
          else if ((Fn & Y) === Y) {
            q = q.next, Y === na && ($ = !0);
            continue;
          } else
            nt = {
              lane: 0,
              revertLane: q.revertLane,
              gesture: null,
              action: q.action,
              hasEagerState: q.hasEagerState,
              eagerState: q.eagerState,
              next: null
            }, z === null ? (x = z = nt, h = c) : z = z.next = nt, Nt.lanes |= Y, Tl |= Y;
          nt = q.action, oa && n(c, nt), c = q.hasEagerState ? q.eagerState : n(c, nt);
        } else
          Y = {
            lane: nt,
            revertLane: q.revertLane,
            gesture: q.gesture,
            action: q.action,
            hasEagerState: q.hasEagerState,
            eagerState: q.eagerState,
            next: null
          }, z === null ? (x = z = Y, h = c) : z = z.next = Y, Nt.lanes |= nt, Tl |= nt;
        q = q.next;
      } while (q !== null && q !== e);
      if (z === null ? h = c : z.next = x, !qe(c, t.memoizedState) && (ae = !0, $ && (n = Qa, n !== null)))
        throw n;
      t.memoizedState = c, t.baseState = h, t.baseQueue = z, a.lastRenderedState = c;
    }
    return u === null && (a.lanes = 0), [t.memoizedState, a.dispatch];
  }
  function Us(t) {
    var e = te(), n = e.queue;
    if (n === null) throw Error(r(311));
    n.lastRenderedReducer = t;
    var a = n.dispatch, u = n.pending, c = e.memoizedState;
    if (u !== null) {
      n.pending = null;
      var h = u = u.next;
      do
        c = t(c, h.action), h = h.next;
      while (h !== u);
      qe(c, e.memoizedState) || (ae = !0), e.memoizedState = c, e.baseQueue === null && (e.baseState = c), n.lastRenderedState = c;
    }
    return [c, a];
  }
  function M0(t, e, n) {
    var a = Nt, u = te(), c = zt;
    if (c) {
      if (n === void 0) throw Error(r(407));
      n = n();
    } else n = e();
    var h = !qe(
      (Zt || u).memoizedState,
      n
    );
    if (h && (u.memoizedState = n, ae = !0), u = u.queue, Vs(A0.bind(null, a, u, t), [
      t
    ]), t = u.getSnapshot !== e || h || le !== null && (le.memoizedState.tag & 1) !== 0, ka(
      t ? 9 : 8,
      { destroy: void 0 },
      C0.bind(null, a, u, n, e),
      null
    ), t) {
      if (a.flags |= 2048, Gt === null) throw Error(r(349));
      c || (Fn & 127) !== 0 || z0(a, e, n);
    }
    return n;
  }
  function z0(t, e, n) {
    t.flags |= 16384, t = { getSnapshot: e, value: n }, e = Nt.updateQueue, e === null ? (e = $o(), Nt.updateQueue = e, e.stores = [t]) : (n = e.stores, n === null ? e.stores = [t] : n.push(t));
  }
  function C0(t, e, n, a) {
    e.value = n, e.getSnapshot = a, O0(e) && D0(t);
  }
  function A0(t, e, n) {
    return n(function() {
      O0(e) && D0(t);
    });
  }
  function O0(t) {
    var e = t.getSnapshot;
    t = t.value;
    try {
      var n = e();
      return !qe(t, n);
    } catch {
      return !0;
    }
  }
  function D0(t) {
    var e = kl(t, 2);
    e !== null && Ye(e, t, 2);
  }
  function Bs(t) {
    var e = ze();
    if (typeof t == "function") {
      var n = t;
      if (t = n(), oa) {
        wn(!0);
        try {
          n();
        } finally {
          wn(!1);
        }
      }
    }
    return e.memoizedState = e.baseState = t, e.queue = {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: Wn,
      lastRenderedState: t
    }, e;
  }
  function R0(t, e, n, a) {
    return t.baseState = n, Hs(
      t,
      Zt,
      typeof a == "function" ? a : Wn
    );
  }
  function IS(t, e, n, a, u) {
    if (Wo(t)) throw Error(r(485));
    if (t = e.action, t !== null) {
      var c = {
        payload: u,
        action: t,
        next: null,
        isTransition: !0,
        status: "pending",
        value: null,
        reason: null,
        listeners: [],
        then: function(h) {
          c.listeners.push(h);
        }
      };
      ct.T !== null ? n(!0) : c.isTransition = !1, a(c), n = e.pending, n === null ? (c.next = e.pending = c, H0(e, c)) : (c.next = n.next, e.pending = n.next = c);
    }
  }
  function H0(t, e) {
    var n = e.action, a = e.payload, u = t.state;
    if (e.isTransition) {
      var c = ct.T, h = {};
      h.types = c !== null ? c.types : null, ct.T = h;
      try {
        var x = n(u, a), z = ct.S;
        z !== null && z(h, x), U0(t, e, x);
      } catch (q) {
        Ys(t, e, q);
      } finally {
        c !== null && h.types !== null && (c.types = h.types), ct.T = c;
      }
    } else
      try {
        c = n(u, a), U0(t, e, c);
      } catch (q) {
        Ys(t, e, q);
      }
  }
  function U0(t, e, n) {
    n !== null && typeof n == "object" && typeof n.then == "function" ? n.then(
      function(a) {
        B0(t, e, a);
      },
      function(a) {
        return Ys(t, e, a);
      }
    ) : B0(t, e, n);
  }
  function B0(t, e, n) {
    e.status = "fulfilled", e.value = n, Y0(e), t.state = n, e = t.pending, e !== null && (n = e.next, n === e ? t.pending = null : (n = n.next, e.next = n, H0(t, n)));
  }
  function Ys(t, e, n) {
    var a = t.pending;
    if (t.pending = null, a !== null) {
      a = a.next;
      do
        e.status = "rejected", e.reason = n, Y0(e), e = e.next;
      while (e !== a);
    }
    t.action = null;
  }
  function Y0(t) {
    t = t.listeners;
    for (var e = 0; e < t.length; e++) (0, t[e])();
  }
  function V0(t, e) {
    return e;
  }
  function L0(t, e) {
    if (zt) {
      var n = Gt.formState;
      if (n !== null) {
        t: {
          var a = Nt;
          if (zt) {
            if (Qt) {
              e: {
                for (var u = Qt, c = nn; u.nodeType !== 8; ) {
                  if (!c) {
                    u = null;
                    break e;
                  }
                  if (u = an(
                    u.nextSibling
                  ), u === null) {
                    u = null;
                    break e;
                  }
                }
                c = u.data, u = c === "F!" || c === "F" ? u : null;
              }
              if (u) {
                Qt = an(
                  u.nextSibling
                ), a = u.data === "F!";
                break t;
              }
            }
            gl(a);
          }
          a = !1;
        }
        a && (e = n[0]);
      }
    }
    return n = ze(), n.memoizedState = n.baseState = e, a = {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: V0,
      lastRenderedState: e
    }, n.queue = a, n = ag.bind(
      null,
      Nt,
      a
    ), a.dispatch = n, a = Bs(!1), c = Zs.bind(
      null,
      Nt,
      !1,
      a.queue
    ), a = ze(), u = {
      state: e,
      dispatch: null,
      action: t,
      pending: null
    }, a.queue = u, n = IS.bind(
      null,
      Nt,
      u,
      c,
      n
    ), u.dispatch = n, a.memoizedState = t, [e, n, !1];
  }
  function q0(t) {
    var e = te();
    return X0(e, Zt, t);
  }
  function X0(t, e, n) {
    if (e = Hs(
      t,
      e,
      V0
    )[0], t = Io(Wn)[0], typeof e == "object" && e !== null && typeof e.then == "function")
      try {
        var a = su(e);
      } catch (h) {
        throw h === Ka ? Lo : h;
      }
    else a = e;
    e = te();
    var u = e.queue, c = u.dispatch;
    return n !== e.memoizedState && (Nt.flags |= 2048, ka(
      9,
      { destroy: void 0 },
      kS.bind(null, u, n),
      null
    )), [a, c, t];
  }
  function kS(t, e) {
    t.action = e;
  }
  function j0(t) {
    var e = te(), n = Zt;
    if (n !== null)
      return X0(e, n, t);
    te(), e = e.memoizedState, n = te();
    var a = n.queue.dispatch;
    return n.memoizedState = t, [e, a, !1];
  }
  function ka(t, e, n, a) {
    return t = { tag: t, create: n, deps: a, inst: e, next: null }, e = Nt.updateQueue, e === null && (e = $o(), Nt.updateQueue = e), n = e.lastEffect, n === null ? e.lastEffect = t.next = t : (a = n.next, n.next = t, t.next = a, e.lastEffect = t), t;
  }
  function Z0() {
    return te().memoizedState;
  }
  function ko(t, e, n, a) {
    var u = ze();
    Nt.flags |= t, u.memoizedState = ka(
      1 | e,
      { destroy: void 0 },
      n,
      a === void 0 ? null : a
    );
  }
  function Fo(t, e, n, a) {
    var u = te();
    a = a === void 0 ? null : a;
    var c = u.memoizedState.inst;
    Zt !== null && a !== null && zs(a, Zt.memoizedState.deps) ? u.memoizedState = ka(e, c, n, a) : (Nt.flags |= t, u.memoizedState = ka(
      1 | e,
      c,
      n,
      a
    ));
  }
  function G0(t, e) {
    ko(8390656, 8, t, e);
  }
  function Vs(t, e) {
    Fo(2048, 8, t, e);
  }
  function FS(t) {
    Nt.flags |= 4;
    var e = Nt.updateQueue;
    if (e === null)
      e = $o(), Nt.updateQueue = e, e.events = [t];
    else {
      var n = e.events;
      n === null ? e.events = [t] : n.push(t);
    }
  }
  function Q0(t) {
    var e = te().memoizedState;
    return FS({ ref: e, nextImpl: t }), function() {
      if ((Vt & 2) !== 0) throw Error(r(440));
      return e.impl.apply(void 0, arguments);
    };
  }
  function K0(t, e) {
    return Fo(4, 2, t, e);
  }
  function $0(t, e) {
    return Fo(4, 4, t, e);
  }
  function J0(t, e) {
    if (typeof e == "function") {
      t = t();
      var n = e(t);
      return function() {
        typeof n == "function" ? n() : e(null);
      };
    }
    if (e != null)
      return t = t(), e.current = t, function() {
        e.current = null;
      };
  }
  function I0(t, e, n) {
    n = n != null ? n.concat([t]) : null, Fo(4, 4, J0.bind(null, e, t), n);
  }
  function Ls() {
  }
  function k0(t, e) {
    var n = te();
    e = e === void 0 ? null : e;
    var a = n.memoizedState;
    return e !== null && zs(e, a[1]) ? a[0] : (n.memoizedState = [t, e], t);
  }
  function F0(t, e) {
    var n = te();
    e = e === void 0 ? null : e;
    var a = n.memoizedState;
    if (e !== null && zs(e, a[1]))
      return a[0];
    if (a = t(), oa) {
      wn(!0);
      try {
        t();
      } finally {
        wn(!1);
      }
    }
    return n.memoizedState = [a, e], a;
  }
  function qs(t, e, n) {
    return n === void 0 || (Fn & 1073741824) !== 0 && (Dt & 261930) === 0 ? t.memoizedState = e : (t.memoizedState = n, t = om(), Nt.lanes |= t, Tl |= t, n);
  }
  function W0(t, e, n, a) {
    return qe(n, e) ? n : xl.current !== null ? (t = qs(t, n, a), qe(t, e) || (ae = !0), t) : (Fn & 106) === 0 || (Fn & 1073741824) !== 0 && (Dt & 261930) === 0 ? (ae = !0, t.memoizedState = n) : (t = om(), Nt.lanes |= t, Tl |= t, e);
  }
  function P0(t, e, n, a, u) {
    var c = rt.p;
    rt.p = c !== 0 && 8 > c ? c : 8;
    var h = ct.T, x = {};
    x.types = h !== null ? h.types : null, ct.T = x, Zs(t, !1, e, n);
    try {
      var z = u(), q = ct.S;
      if (q !== null && q(x, z), z !== null && typeof z == "object" && typeof z.then == "function") {
        var $ = KS(
          z,
          a
        );
        fu(
          t,
          e,
          $,
          Qe(t)
        );
      } else
        fu(
          t,
          e,
          a,
          Qe(t)
        );
    } catch (nt) {
      fu(
        t,
        e,
        { then: function() {
        }, status: "rejected", reason: nt },
        Qe()
      );
    } finally {
      rt.p = c, h !== null && x.types !== null && (h.types = x.types), ct.T = h;
    }
  }
  function WS() {
  }
  function Xs(t, e, n, a) {
    if (t.tag !== 5) throw Error(r(476));
    var u = tg(t).queue;
    P0(
      t,
      u,
      e,
      vt,
      n === null ? WS : function() {
        return eg(t), n(a);
      }
    );
  }
  function tg(t) {
    var e = t.memoizedState;
    if (e !== null) return e;
    e = {
      memoizedState: vt,
      baseState: vt,
      baseQueue: null,
      queue: {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: Wn,
        lastRenderedState: vt
      },
      next: null
    };
    var n = {};
    return e.next = {
      memoizedState: n,
      baseState: n,
      baseQueue: null,
      queue: {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: Wn,
        lastRenderedState: n
      },
      next: null
    }, t.memoizedState = e, t = t.alternate, t !== null && (t.memoizedState = e), e;
  }
  function eg(t) {
    var e = tg(t);
    e.next === null && (e = t.alternate.memoizedState), fu(
      t,
      e.next.queue,
      {},
      Qe()
    );
  }
  function js() {
    return ge(mi);
  }
  function ng() {
    return te().memoizedState;
  }
  function lg() {
    return te().memoizedState;
  }
  function PS(t) {
    for (var e = t.return; e !== null; ) {
      switch (e.tag) {
        case 24:
        case 3:
          var n = Qe();
          t = pl(n);
          var a = Sl(e, t, n);
          a !== null && (Ye(a, e, n), iu(a, e, n)), e = { cache: ys() }, t.payload = e;
          return;
      }
      e = e.return;
    }
  }
  function tx(t, e, n) {
    var a = Qe();
    n = {
      lane: a,
      revertLane: 0,
      gesture: null,
      action: n,
      hasEagerState: !1,
      eagerState: null,
      next: null
    }, Wo(t) ? ig(e, n) : (n = os(t, e, n, a), n !== null && (Ye(n, t, a), ug(n, e, a)));
  }
  function ag(t, e, n) {
    var a = Qe();
    fu(t, e, n, a);
  }
  function fu(t, e, n, a) {
    var u = {
      lane: a,
      revertLane: 0,
      gesture: null,
      action: n,
      hasEagerState: !1,
      eagerState: null,
      next: null
    };
    if (Wo(t)) ig(e, u);
    else {
      var c = t.alternate;
      if (t.lanes === 0 && (c === null || c.lanes === 0) && (c = e.lastRenderedReducer, c !== null))
        try {
          var h = e.lastRenderedState, x = c(h, n);
          if (u.hasEagerState = !0, u.eagerState = x, qe(x, h))
            return Co(t, e, u, 0), Gt === null && zo(), !1;
        } catch {
        }
      if (n = os(t, e, u, a), n !== null)
        return Ye(n, t, a), ug(n, e, a), !0;
    }
    return !1;
  }
  function Zs(t, e, n, a) {
    if (a = {
      lane: 2,
      revertLane: Hf(),
      gesture: null,
      action: a,
      hasEagerState: !1,
      eagerState: null,
      next: null
    }, Wo(t)) {
      if (e) throw Error(r(479));
    } else
      e = os(
        t,
        n,
        a,
        2
      ), e !== null && Ye(e, t, 2);
  }
  function Wo(t) {
    var e = t.alternate;
    return t === Nt || e !== null && e === Nt;
  }
  function ig(t, e) {
    Ja = Qo = !0;
    var n = t.pending;
    n === null ? e.next = e : (e.next = n.next, n.next = e), t.pending = e;
  }
  function ug(t, e, n) {
    if ((n & 4194048) !== 0) {
      var a = e.lanes;
      a &= t.pendingLanes, n |= a, e.lanes = n, co(t, n);
    }
  }
  var Po = {
    readContext: ge,
    use: Jo,
    useCallback: Ft,
    useContext: Ft,
    useEffect: Ft,
    useImperativeHandle: Ft,
    useLayoutEffect: Ft,
    useInsertionEffect: Ft,
    useMemo: Ft,
    useReducer: Ft,
    useRef: Ft,
    useState: Ft,
    useDebugValue: Ft,
    useDeferredValue: Ft,
    useTransition: Ft,
    useSyncExternalStore: Ft,
    useId: Ft,
    useHostTransitionStatus: Ft,
    useFormState: Ft,
    useActionState: Ft,
    useOptimistic: Ft,
    useMemoCache: Ft,
    useCacheRefresh: Ft,
    useEffectEvent: Ft
  }, og = {
    readContext: ge,
    use: Jo,
    useCallback: function(t, e) {
      return ze().memoizedState = [
        t,
        e === void 0 ? null : e
      ], t;
    },
    useContext: ge,
    useEffect: G0,
    useImperativeHandle: function(t, e, n) {
      n = n != null ? n.concat([t]) : null, ko(
        4194308,
        4,
        J0.bind(null, e, t),
        n
      );
    },
    useLayoutEffect: function(t, e) {
      return ko(4194308, 4, t, e);
    },
    useInsertionEffect: function(t, e) {
      ko(4, 2, t, e);
    },
    useMemo: function(t, e) {
      var n = ze();
      e = e === void 0 ? null : e;
      var a = t();
      if (oa) {
        wn(!0);
        try {
          t();
        } finally {
          wn(!1);
        }
      }
      return n.memoizedState = [a, e], a;
    },
    useReducer: function(t, e, n) {
      var a = ze();
      if (n !== void 0) {
        var u = n(e);
        if (oa) {
          wn(!0);
          try {
            n(e);
          } finally {
            wn(!1);
          }
        }
      } else u = e;
      return a.memoizedState = a.baseState = u, t = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: t,
        lastRenderedState: u
      }, a.queue = t, t = t.dispatch = tx.bind(
        null,
        Nt,
        t
      ), [a.memoizedState, t];
    },
    useRef: function(t) {
      var e = ze();
      return t = { current: t }, e.memoizedState = t;
    },
    useState: function(t) {
      t = Bs(t);
      var e = t.queue, n = ag.bind(null, Nt, e);
      return e.dispatch = n, [t.memoizedState, n];
    },
    useDebugValue: Ls,
    useDeferredValue: function(t, e) {
      var n = ze();
      return qs(n, t, e);
    },
    useTransition: function() {
      var t = Bs(!1);
      return t = P0.bind(
        null,
        Nt,
        t.queue,
        !0,
        !1
      ), ze().memoizedState = t, [!1, t];
    },
    useSyncExternalStore: function(t, e, n) {
      var a = Nt, u = ze();
      if (zt) {
        if (n === void 0)
          throw Error(r(407));
        n = n();
      } else {
        if (n = e(), Gt === null)
          throw Error(r(349));
        (Dt & 127) !== 0 || z0(a, e, n);
      }
      u.memoizedState = n;
      var c = { value: n, getSnapshot: e };
      return u.queue = c, G0(A0.bind(null, a, c, t), [
        t
      ]), a.flags |= 2048, ka(
        9,
        { destroy: void 0 },
        C0.bind(
          null,
          a,
          c,
          n,
          e
        ),
        null
      ), n;
    },
    useId: function() {
      var t = ze(), e = Gt.identifierPrefix;
      if (zt) {
        var n = Mn, a = Tn;
        n = (a & ~(1 << 32 - Te(a) - 1)).toString(32) + n, e = "_" + e + "R_" + n, n = Ko++, 0 < n && (e += "H" + n.toString(32)), e += "_";
      } else
        n = $S++, e = "_" + e + "r_" + n.toString(32) + "_";
      return t.memoizedState = e;
    },
    useHostTransitionStatus: js,
    useFormState: L0,
    useActionState: L0,
    useOptimistic: function(t) {
      var e = ze();
      e.memoizedState = e.baseState = t;
      var n = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: null,
        lastRenderedState: null
      };
      return e.queue = n, e = Zs.bind(
        null,
        Nt,
        !0,
        n
      ), n.dispatch = e, [t, e];
    },
    useMemoCache: Rs,
    useCacheRefresh: function() {
      return ze().memoizedState = PS.bind(
        null,
        Nt
      );
    },
    useEffectEvent: function(t) {
      var e = ze(), n = { impl: t };
      return e.memoizedState = n, function() {
        if ((Vt & 2) !== 0)
          throw Error(r(440));
        return n.impl.apply(void 0, arguments);
      };
    }
  }, cg = {
    readContext: ge,
    use: Jo,
    useCallback: k0,
    useContext: ge,
    useEffect: Vs,
    useImperativeHandle: I0,
    useInsertionEffect: K0,
    useLayoutEffect: $0,
    useMemo: F0,
    useReducer: Io,
    useRef: Z0,
    useState: function() {
      return Io(Wn);
    },
    useDebugValue: Ls,
    useDeferredValue: function(t, e) {
      var n = te();
      return W0(
        n,
        Zt.memoizedState,
        t,
        e
      );
    },
    useTransition: function() {
      var t = Io(Wn)[0], e = te().memoizedState;
      return [
        typeof t == "boolean" ? t : su(t),
        e
      ];
    },
    useSyncExternalStore: M0,
    useId: ng,
    useHostTransitionStatus: js,
    useFormState: q0,
    useActionState: q0,
    useOptimistic: function(t, e) {
      var n = te();
      return R0(n, Zt, t, e);
    },
    useMemoCache: Rs,
    useCacheRefresh: lg,
    useEffectEvent: Q0
  }, ex = {
    readContext: ge,
    use: Jo,
    useCallback: k0,
    useContext: ge,
    useEffect: Vs,
    useImperativeHandle: I0,
    useInsertionEffect: K0,
    useLayoutEffect: $0,
    useMemo: F0,
    useReducer: Us,
    useRef: Z0,
    useState: function() {
      return Us(Wn);
    },
    useDebugValue: Ls,
    useDeferredValue: function(t, e) {
      var n = te();
      return Zt === null ? qs(n, t, e) : W0(
        n,
        Zt.memoizedState,
        t,
        e
      );
    },
    useTransition: function() {
      var t = Us(Wn)[0], e = te().memoizedState;
      return [
        typeof t == "boolean" ? t : su(t),
        e
      ];
    },
    useSyncExternalStore: M0,
    useId: ng,
    useHostTransitionStatus: js,
    useFormState: j0,
    useActionState: j0,
    useOptimistic: function(t, e) {
      var n = te();
      return Zt !== null ? R0(n, Zt, t, e) : (n.baseState = t, [t, n.queue.dispatch]);
    },
    useMemoCache: Rs,
    useCacheRefresh: lg,
    useEffectEvent: Q0
  };
  function Gs(t, e, n, a) {
    e = t.memoizedState, n = n(a, e), n = n == null ? e : R({}, e, n), t.memoizedState = n, t.lanes === 0 && (t.updateQueue.baseState = n);
  }
  var Qs = {
    enqueueSetState: function(t, e, n) {
      t = t._reactInternals;
      var a = Qe(), u = pl(a);
      u.payload = e, n != null && (u.callback = n), e = Sl(t, u, a), e !== null && (Ye(e, t, a), iu(e, t, a));
    },
    enqueueReplaceState: function(t, e, n) {
      t = t._reactInternals;
      var a = Qe(), u = pl(a);
      u.tag = 1, u.payload = e, n != null && (u.callback = n), e = Sl(t, u, a), e !== null && (Ye(e, t, a), iu(e, t, a));
    },
    enqueueForceUpdate: function(t, e) {
      t = t._reactInternals;
      var n = Qe(), a = pl(n);
      a.tag = 2, e != null && (a.callback = e), e = Sl(t, a, n), e !== null && (Ye(e, t, n), iu(e, t, n));
    }
  };
  function rg(t, e, n, a, u, c, h) {
    return t = t.stateNode, typeof t.shouldComponentUpdate == "function" ? t.shouldComponentUpdate(a, c, h) : e.prototype && e.prototype.isPureReactComponent ? !Fi(n, a) || !Fi(u, c) : !0;
  }
  function sg(t, e, n, a) {
    t = e.state, typeof e.componentWillReceiveProps == "function" && e.componentWillReceiveProps(n, a), typeof e.UNSAFE_componentWillReceiveProps == "function" && e.UNSAFE_componentWillReceiveProps(n, a), e.state !== t && Qs.enqueueReplaceState(e, e.state, null);
  }
  function ca(t, e) {
    var n = e;
    if ("ref" in e) {
      n = {};
      for (var a in e)
        a !== "ref" && (n[a] = e[a]);
    }
    if (t = t.defaultProps) {
      n === e && (n = R({}, n));
      for (var u in t)
        n[u] === void 0 && (n[u] = t[u]);
    }
    return n;
  }
  function fg(t) {
    Mo(t);
  }
  function dg(t) {
    console.error(t);
  }
  function hg(t) {
    Mo(t);
  }
  function tc(t, e) {
    try {
      var n = t.onUncaughtError;
      n(e.value, { componentStack: e.stack });
    } catch (a) {
      setTimeout(function() {
        throw a;
      });
    }
  }
  function gg(t, e, n) {
    try {
      var a = t.onCaughtError;
      a(n.value, {
        componentStack: n.stack,
        errorBoundary: e.tag === 1 ? e.stateNode : null
      });
    } catch (u) {
      setTimeout(function() {
        throw u;
      });
    }
  }
  function Ks(t, e, n) {
    return n = pl(n), n.tag = 3, n.payload = { element: null }, n.callback = function() {
      tc(t, e);
    }, n;
  }
  function mg(t) {
    return t = pl(t), t.tag = 3, t;
  }
  function yg(t, e, n, a) {
    var u = n.type.getDerivedStateFromError;
    if (typeof u == "function") {
      var c = a.value;
      t.payload = function() {
        return u(c);
      }, t.callback = function() {
        gg(e, n, a);
      };
    }
    var h = n.stateNode;
    h !== null && typeof h.componentDidCatch == "function" && (t.callback = function() {
      gg(e, n, a), typeof u != "function" && (Ml === null ? Ml = /* @__PURE__ */ new Set([this]) : Ml.add(this));
      var x = a.stack;
      this.componentDidCatch(a.value, {
        componentStack: x !== null ? x : ""
      });
    });
  }
  function nx(t, e, n, a, u) {
    if (n.flags |= 32768, a !== null && typeof a == "object" && typeof a.then == "function") {
      if (e = n.alternate, e !== null && ta(
        e,
        n,
        u,
        !0
      ), n = me.current, n !== null) {
        switch (n.tag) {
          case 31:
          case 13:
          case 19:
            return Ee === null ? bc() : n.alternate === null && Wt === 0 && (Wt = 3), n.flags &= -257, n.flags |= 65536, n.lanes = u, a === qo ? n.flags |= 16384 : (e = n.updateQueue, e === null ? n.updateQueue = /* @__PURE__ */ new Set([a]) : e.add(a), Of(t, a, u)), !1;
          case 22:
            return n.flags |= 65536, a === qo ? n.flags |= 16384 : (e = n.updateQueue, e === null ? (e = {
              transitions: null,
              markerInstances: null,
              retryQueue: /* @__PURE__ */ new Set([a])
            }, n.updateQueue = e) : (n = e.retryQueue, n === null ? e.retryQueue = /* @__PURE__ */ new Set([a]) : n.add(a)), Of(t, a, u)), !1;
        }
        throw Error(r(435, n.tag));
      }
      return Of(t, a, u), bc(), !1;
    }
    if (zt)
      return e = me.current, e !== null ? ((e.flags & 65536) === 0 && (e.flags |= 256), e.flags |= 65536, e.lanes = u, a !== ds && (t = Error(r(422), { cause: a }), tu(Pe(t, n)))) : (a !== ds && (e = Error(r(423), {
        cause: a
      }), tu(
        Pe(e, n)
      )), t = t.current.alternate, t.flags |= 65536, u &= -u, t.lanes |= u, a = Pe(a, n), u = Ks(
        t.stateNode,
        a,
        u
      ), Es(t, u), Wt !== 4 && (Wt = 2)), !1;
    var c = Error(r(520), { cause: a });
    if (c = Pe(c, n), Su === null ? Su = [c] : Su.push(c), Wt !== 4 && (Wt = 2), e === null) return !0;
    a = Pe(a, n), n = e;
    do {
      switch (n.tag) {
        case 3:
          return n.flags |= 65536, t = u & -u, n.lanes |= t, t = Ks(n.stateNode, a, t), Es(n, t), !1;
        case 1:
          if (e = n.type, c = n.stateNode, (n.flags & 128) === 0 && (typeof e.getDerivedStateFromError == "function" || c !== null && typeof c.componentDidCatch == "function" && (Ml === null || !Ml.has(c))))
            return n.flags |= 65536, u &= -u, n.lanes |= u, u = mg(u), yg(
              u,
              t,
              n,
              a
            ), Es(n, u), !1;
          break;
        case 22:
          if (n.memoizedState !== null)
            return n.flags |= 65536, !1;
      }
      n = n.return;
    } while (n !== null);
    return !1;
  }
  var $s = Error(r(461)), ae = !1;
  function ce(t, e, n, a) {
    e.child = t === null ? x0(e, null, n, a) : ua(
      e,
      t.child,
      n,
      a
    );
  }
  function vg(t, e, n, a, u) {
    n = n.render;
    var c = e.ref;
    if ("ref" in a) {
      var h = {};
      for (var x in a)
        x !== "ref" && (h[x] = a[x]);
    } else h = a;
    return ea(e), a = Cs(
      t,
      e,
      n,
      h,
      c,
      u
    ), x = As(), t !== null && !ae ? (Os(t, e, u), Pn(t, e, u)) : (zt && x && Ro(e), e.flags |= 1, ce(t, e, a, u), e.child);
  }
  function pg(t, e, n, a, u) {
    if (t === null) {
      var c = n.type;
      return typeof c == "function" && !cs(c) && c.defaultProps === void 0 && n.compare === null ? (e.tag = 15, e.type = c, Sg(
        t,
        e,
        c,
        a,
        u
      )) : (t = Oo(
        n.type,
        null,
        a,
        e,
        e.mode,
        u
      ), t.ref = e.ref, t.return = e, e.child = t);
    }
    if (c = t.child, !ef(t, u)) {
      var h = c.memoizedProps;
      if (n = n.compare, n = n !== null ? n : Fi, n(h, a) && t.ref === e.ref)
        return Pn(t, e, u);
    }
    return e.flags |= 1, t = $n(c, a), t.ref = e.ref, t.return = e, e.child = t;
  }
  function Sg(t, e, n, a, u) {
    if (t !== null) {
      var c = t.memoizedProps;
      if (Fi(c, a) && t.ref === e.ref)
        if (ae = !1, e.pendingProps = a = c, ef(t, u))
          (t.flags & 131072) !== 0 && (ae = !0);
        else
          return e.lanes = t.lanes, Pn(t, e, u);
    }
    return Js(
      t,
      e,
      n,
      a,
      u
    );
  }
  function xg(t, e, n, a) {
    var u = a.children, c = t !== null ? t.memoizedState : null;
    if (t === null && e.stateNode === null && (e.stateNode = {
      _visibility: 1,
      _pendingMarkers: null,
      _retryCache: null,
      _transitions: null
    }), a.mode === "hidden") {
      if ((e.flags & 128) !== 0) {
        if (c = c !== null ? c.baseLanes | n : n, t !== null) {
          for (a = e.child = t.child, u = 0; a !== null; )
            u = u | a.lanes | a.childLanes, a = a.sibling;
          a = u & ~c;
        } else a = 0, e.child = null;
        return bg(
          t,
          e,
          c,
          n,
          a
        );
      }
      if ((n & 536870912) !== 0)
        e.memoizedState = { baseLanes: 0, cachePool: null }, t !== null && Vo(
          e,
          c !== null ? c.cachePool : null
        ), c !== null ? _0(e, c) : ws(), w0(e);
      else
        return a = e.lanes = 536870912, bg(
          t,
          e,
          c !== null ? c.baseLanes | n : n,
          n,
          a
        );
    } else
      c !== null ? (Vo(e, c.cachePool), _0(e, c), El(), e.memoizedState = null) : (t !== null && Vo(e, null), ws(), El());
    return ce(t, e, u, n), e.child;
  }
  function du(t, e) {
    return t !== null && t.tag === 22 || e.stateNode !== null || (e.stateNode = {
      _visibility: 1,
      _pendingMarkers: null,
      _retryCache: null,
      _transitions: null
    }), e.sibling;
  }
  function bg(t, e, n, a, u) {
    var c = ps();
    return c = c === null ? null : { parent: ne._currentValue, pool: c }, e.memoizedState = {
      baseLanes: n,
      cachePool: c
    }, t !== null && Vo(e, null), ws(), w0(e), t !== null && ta(t, e, a, !0), e.childLanes = u, null;
  }
  function ec(t, e) {
    return e = nc(
      { mode: e.mode, children: e.children },
      t.mode
    ), e.ref = t.ref, t.child = e, e.return = t, e;
  }
  function Eg(t, e, n) {
    return ua(e, t.child, null, n), t = ec(e, e.pendingProps), t.flags |= 2, Xe(e), e.memoizedState = null, t;
  }
  function lx(t, e, n) {
    var a = e.pendingProps, u = (e.flags & 128) !== 0;
    if (e.flags &= -129, t === null) {
      if (zt) {
        if (a.mode === "hidden")
          return t = ec(e, a), e.lanes = 536870912, t.memoizedState = { baseLanes: 0, cachePool: null }, du(null, t);
        if (Ts(e), (t = Qt) ? (t = Jm(
          t,
          nn
        ), t = t !== null && t.data === "&" ? t : null, t !== null && (e.memoizedState = {
          dehydrated: t,
          treeContext: dl !== null ? { id: Tn, overflow: Mn } : null,
          retryLane: 536870912,
          hydrationErrors: null
        }, n = i0(t), n.return = e, e.child = n, se = e, Qt = null)) : t = null, t === null) throw gl(e);
        return e.lanes = 536870912, null;
      }
      return ec(e, a);
    }
    var c = t.memoizedState;
    if (c !== null) {
      var h = c.dehydrated;
      if (Ts(e), u)
        if (e.flags & 256)
          e.flags &= -257, e = Eg(
            t,
            e,
            n
          );
        else if (e.memoizedState !== null)
          e.child = t.child, e.flags |= 128, e = null;
        else throw Error(r(558));
      else if (ae || ta(t, e, n, !1), u = (n & t.childLanes) !== 0, ae || u) {
        if (xl.current === null) {
          if (a = Gt, a !== null && (h = ro(a, n), h !== 0 && h !== c.retryLane))
            throw c.retryLane = h, kl(t, h), Ye(a, t, h), $s;
          bc();
        }
        e = Eg(
          t,
          e,
          n
        );
      } else
        t = c.treeContext, Qt = an(h.nextSibling), se = e, zt = !0, hl = null, nn = !1, t !== null && c0(e, t), e = ec(e, a), e.flags |= 134221824;
      return e;
    }
    return t = $n(t.child, {
      mode: a.mode,
      children: a.children
    }), t.ref = e.ref, e.child = t, t.return = e, t;
  }
  function Fa(t, e) {
    var n = e.ref;
    if (n === null)
      t !== null && t.ref !== null && (e.flags |= 4194816);
    else {
      if (typeof n != "function" && typeof n != "object")
        throw Error(r(284));
      (t === null || t.ref !== n) && (e.flags |= 4194816);
    }
  }
  function Js(t, e, n, a, u) {
    return ea(e), n = Cs(
      t,
      e,
      n,
      a,
      void 0,
      u
    ), a = As(), t !== null && !ae ? (Os(t, e, u), Pn(t, e, u)) : (zt && a && Ro(e), e.flags |= 1, ce(t, e, n, u), e.child);
  }
  function _g(t, e, n, a, u, c) {
    return ea(e), e.updateQueue = null, n = T0(
      e,
      a,
      n,
      u
    ), N0(t), a = As(), t !== null && !ae ? (Os(t, e, c), Pn(t, e, c)) : (zt && a && Ro(e), e.flags |= 1, ce(t, e, n, c), e.child);
  }
  function wg(t, e, n, a, u) {
    if (ea(e), e.stateNode === null) {
      var c = Xa, h = n.contextType;
      typeof h == "object" && h !== null && (c = ge(h)), c = new n(a, c), e.memoizedState = c.state !== null && c.state !== void 0 ? c.state : null, c.updater = Qs, e.stateNode = c, c._reactInternals = e, c = e.stateNode, c.props = a, c.state = e.memoizedState, c.refs = {}, xs(e), h = n.contextType, c.context = typeof h == "object" && h !== null ? ge(h) : Xa, c.state = e.memoizedState, h = n.getDerivedStateFromProps, typeof h == "function" && (Gs(
        e,
        n,
        h,
        a
      ), c.state = e.memoizedState), typeof n.getDerivedStateFromProps == "function" || typeof c.getSnapshotBeforeUpdate == "function" || typeof c.UNSAFE_componentWillMount != "function" && typeof c.componentWillMount != "function" || (h = c.state, typeof c.componentWillMount == "function" && c.componentWillMount(), typeof c.UNSAFE_componentWillMount == "function" && c.UNSAFE_componentWillMount(), h !== c.state && Qs.enqueueReplaceState(c, c.state, null), ou(e, a, c, u), uu(), c.state = e.memoizedState), typeof c.componentDidMount == "function" && (e.flags |= 4194308), a = !0;
    } else if (t === null) {
      c = e.stateNode;
      var x = e.memoizedProps, z = ca(n, x);
      c.props = z;
      var q = c.context, $ = n.contextType;
      h = Xa, typeof $ == "object" && $ !== null && (h = ge($));
      var nt = n.getDerivedStateFromProps;
      $ = typeof nt == "function" || typeof c.getSnapshotBeforeUpdate == "function", x = e.pendingProps !== x, $ || typeof c.UNSAFE_componentWillReceiveProps != "function" && typeof c.componentWillReceiveProps != "function" || (x || q !== h) && sg(
        e,
        c,
        a,
        h
      ), vl = !1;
      var Y = e.memoizedState;
      c.state = Y, ou(e, a, c, u), uu(), q = e.memoizedState, x || Y !== q || vl ? (typeof nt == "function" && (Gs(
        e,
        n,
        nt,
        a
      ), q = e.memoizedState), (z = vl || rg(
        e,
        n,
        z,
        a,
        Y,
        q,
        h
      )) ? ($ || typeof c.UNSAFE_componentWillMount != "function" && typeof c.componentWillMount != "function" || (typeof c.componentWillMount == "function" && c.componentWillMount(), typeof c.UNSAFE_componentWillMount == "function" && c.UNSAFE_componentWillMount()), typeof c.componentDidMount == "function" && (e.flags |= 4194308)) : (typeof c.componentDidMount == "function" && (e.flags |= 4194308), e.memoizedProps = a, e.memoizedState = q), c.props = a, c.state = q, c.context = h, a = z) : (typeof c.componentDidMount == "function" && (e.flags |= 4194308), a = !1);
    } else {
      c = e.stateNode, bs(t, e), h = e.memoizedProps, $ = ca(n, h), c.props = $, nt = e.pendingProps, Y = c.context, q = n.contextType, z = Xa, typeof q == "object" && q !== null && (z = ge(q)), x = n.getDerivedStateFromProps, (q = typeof x == "function" || typeof c.getSnapshotBeforeUpdate == "function") || typeof c.UNSAFE_componentWillReceiveProps != "function" && typeof c.componentWillReceiveProps != "function" || (h !== nt || Y !== z) && sg(
        e,
        c,
        a,
        z
      ), vl = !1, Y = e.memoizedState, c.state = Y, ou(e, a, c, u), uu();
      var Q = e.memoizedState;
      h !== nt || Y !== Q || vl || t !== null && t.dependencies !== null && Bo(t.dependencies) ? (typeof x == "function" && (Gs(
        e,
        n,
        x,
        a
      ), Q = e.memoizedState), ($ = vl || rg(
        e,
        n,
        $,
        a,
        Y,
        Q,
        z
      ) || t !== null && t.dependencies !== null && Bo(t.dependencies)) ? (q || typeof c.UNSAFE_componentWillUpdate != "function" && typeof c.componentWillUpdate != "function" || (typeof c.componentWillUpdate == "function" && c.componentWillUpdate(a, Q, z), typeof c.UNSAFE_componentWillUpdate == "function" && c.UNSAFE_componentWillUpdate(
        a,
        Q,
        z
      )), typeof c.componentDidUpdate == "function" && (e.flags |= 4), typeof c.getSnapshotBeforeUpdate == "function" && (e.flags |= 1024)) : (typeof c.componentDidUpdate != "function" || h === t.memoizedProps && Y === t.memoizedState || (e.flags |= 4), typeof c.getSnapshotBeforeUpdate != "function" || h === t.memoizedProps && Y === t.memoizedState || (e.flags |= 1024), e.memoizedProps = a, e.memoizedState = Q), c.props = a, c.state = Q, c.context = z, a = $) : (typeof c.componentDidUpdate != "function" || h === t.memoizedProps && Y === t.memoizedState || (e.flags |= 4), typeof c.getSnapshotBeforeUpdate != "function" || h === t.memoizedProps && Y === t.memoizedState || (e.flags |= 1024), a = !1);
    }
    return c = a, Fa(t, e), a = (e.flags & 128) !== 0, c || a ? (c = e.stateNode, n = a && typeof n.getDerivedStateFromError != "function" ? null : c.render(), e.flags |= 1, t !== null && a ? (e.child = ua(
      e,
      t.child,
      null,
      u
    ), e.child = ua(
      e,
      null,
      n,
      u
    )) : ce(t, e, n, u), e.memoizedState = c.state, t = e.child) : t = Pn(
      t,
      e,
      u
    ), t;
  }
  function Ng(t, e, n, a) {
    return Wl(), e.flags |= 256, ce(t, e, n, a), e.child;
  }
  var Is = {
    dehydrated: null,
    treeContext: null,
    retryLane: 0,
    hydrationErrors: null
  };
  function ks(t) {
    return { baseLanes: t, cachePool: g0() };
  }
  function Fs(t, e, n) {
    return t = t !== null ? t.childLanes & ~n : 0, e && (t |= Ge), t;
  }
  function Tg(t, e, n) {
    var a = e.pendingProps, u = !1, c = (e.flags & 128) !== 0, h;
    if ((h = c) || (h = t !== null && t.memoizedState === null ? !1 : (ye.current & 2) !== 0), h && (u = !0, e.flags &= -129), h = (e.flags & 32) !== 0, e.flags &= -33, t === null) {
      if (zt) {
        if (u ? bl(e) : El(), (t = Qt) ? (t = Jm(
          t,
          nn
        ), t = t !== null && t.data !== "&" ? t : null, t !== null && (e.memoizedState = {
          dehydrated: t,
          treeContext: dl !== null ? { id: Tn, overflow: Mn } : null,
          retryLane: 536870912,
          hydrationErrors: null
        }, n = i0(t), n.return = e, e.child = n, se = e, Qt = null)) : t = null, t === null) throw gl(e);
        return Ff(t) ? e.lanes = 32 : e.lanes = 536870912, null;
      }
      return c = a.children, a = a.fallback, u ? (El(), u = e.mode, c = nc(
        { mode: "hidden", children: c },
        u
      ), a = Fl(
        a,
        u,
        n,
        null
      ), c.return = e, a.return = e, c.sibling = a, e.child = c, a = e.child, a.memoizedState = ks(n), a.childLanes = Fs(
        t,
        h,
        n
      ), e.memoizedState = Is, du(null, a)) : (bl(e), Ws(e, c));
    }
    var x = t.memoizedState;
    if (x !== null) {
      var z = x.dehydrated;
      if (z !== null)
        return ax(
          t,
          e,
          c,
          h,
          a,
          z,
          x,
          n
        );
    }
    return u ? (El(), u = a.fallback, c = e.mode, x = t.child, z = x.sibling, a = $n(x, {
      mode: "hidden",
      children: a.children
    }), a.subtreeFlags = x.subtreeFlags & 1206910976, z !== null ? u = $n(z, u) : (u = Fl(
      u,
      c,
      n,
      null
    ), u.flags |= 2), u.return = e, a.return = e, a.sibling = u, e.child = a, du(null, a), a = e.child, u = t.child.memoizedState, u === null ? u = ks(n) : (c = u.cachePool, c !== null ? (x = ne._currentValue, c = c.parent !== x ? { parent: x, pool: x } : c) : c = g0(), u = {
      baseLanes: u.baseLanes | n,
      cachePool: c
    }), a.memoizedState = u, a.childLanes = Fs(
      t,
      h,
      n
    ), e.memoizedState = Is, du(t.child, a)) : (bl(e), n = t.child, t = n.sibling, n = $n(n, {
      mode: "visible",
      children: a.children
    }), n.return = e, n.sibling = null, t !== null && (h = e.deletions, h === null ? (e.deletions = [t], e.flags |= 16) : h.push(t)), e.child = n, e.memoizedState = null, n);
  }
  function Ws(t, e) {
    return e = nc(
      { mode: "visible", children: e },
      t.mode
    ), e.return = t, t.child = e;
  }
  function nc(t, e) {
    return t = Re(22, t, null, e), t.lanes = 0, t;
  }
  function lc(t, e, n) {
    return ua(e, t.child, null, n), t = Ws(
      e,
      e.pendingProps.children
    ), t.flags |= 2, e.memoizedState = null, t;
  }
  function ax(t, e, n, a, u, c, h, x) {
    if (n)
      return e.flags & 256 ? (bl(e), e.flags &= -257, lc(
        t,
        e,
        x
      )) : e.memoizedState !== null ? (El(), e.child = t.child, e.flags |= 128, null) : (El(), c = u.fallback, h = e.mode, u = nc(
        { mode: "visible", children: u.children },
        h
      ), c = Fl(
        c,
        h,
        x,
        null
      ), c.flags |= 2, u.return = e, c.return = e, u.sibling = c, e.child = u, ua(e, t.child, null, x), u = e.child, u.memoizedState = ks(x), u.childLanes = Fs(
        t,
        a,
        x
      ), e.memoizedState = Is, du(null, u));
    if (bl(e), Ff(c)) {
      if (a = c.nextSibling && c.nextSibling.dataset, a) var z = a.dgst;
      return a = z, a !== "" && (u = Error(r(419)), u.stack = "", u.digest = a, tu({ value: u, source: null, stack: null })), lc(
        t,
        e,
        x
      );
    }
    if (ae || ta(t, e, x, !1), a = (x & t.childLanes) !== 0, ae || a) {
      if (xl.current !== null)
        return lc(
          t,
          e,
          x
        );
      if (a = Gt, a !== null && (u = ro(
        a,
        x
      ), u !== 0 && u !== h.retryLane))
        throw h.retryLane = u, kl(t, u), Ye(a, t, u), $s;
      return kf(c) || bc(), lc(
        t,
        e,
        x
      );
    }
    return kf(c) ? (e.flags |= 192, e.child = t.child, null) : (t = h.treeContext, Qt = an(c.nextSibling), se = e, zt = !0, hl = null, nn = !1, t !== null && c0(e, t), e = Ws(
      e,
      u.children
    ), e.flags |= 134221824, e);
  }
  function Mg(t, e, n) {
    t.lanes |= e;
    var a = t.alternate;
    a !== null && (a.lanes |= e), Uo(t.return, e, n);
  }
  function zg(t) {
    for (var e = null; t !== null; ) {
      var n = t.alternate;
      n !== null && Go(n) === null && (e = t), t = t.sibling;
    }
    return e;
  }
  function ac(t, e, n, a, u, c) {
    var h = t.memoizedState;
    h === null ? t.memoizedState = {
      isBackwards: e,
      rendering: null,
      renderingStartTime: 0,
      last: a,
      tail: n,
      tailMode: u,
      treeForkCount: c
    } : (h.isBackwards = e, h.rendering = null, h.renderingStartTime = 0, h.last = a, h.tail = n, h.tailMode = u, h.treeForkCount = c);
  }
  function Ps(t) {
    var e = t.child;
    for (t.child = null; e !== null; ) {
      var n = e.sibling;
      e.sibling = t.child, t.child = e, e = n;
    }
  }
  function tf(t, e, n) {
    var a = e.pendingProps, u = a.revealOrder, c = a.tail;
    a = a.children;
    var h = ye.current;
    if (e.flags & 128)
      return cu(e, h), null;
    var x = (h & 2) !== 0;
    if (x ? (h = h & 1 | 2, e.flags |= 128) : h &= 1, cu(e, h), u === "backwards" && t !== null ? (Ps(t), ce(t, e, a, n), Ps(t)) : ce(t, e, a, n), a = zt ? Pi : 0, !x && t !== null && (t.flags & 128) !== 0)
      t: for (t = e.child; t !== null; ) {
        if (t.tag === 13)
          t.memoizedState !== null && Mg(t, n, e);
        else if (t.tag === 19)
          Mg(t, n, e);
        else if (t.child !== null) {
          t.child.return = t, t = t.child;
          continue;
        }
        if (t === e) break t;
        for (; t.sibling === null; ) {
          if (t.return === null || t.return === e)
            break t;
          t = t.return;
        }
        t.sibling.return = t.return, t = t.sibling;
      }
    switch (u) {
      case "backwards":
        n = zg(e.child), n === null ? (u = e.child, e.child = null) : (u = n.sibling, n.sibling = null, Ps(e)), ac(
          e,
          !0,
          u,
          null,
          c,
          a
        );
        break;
      case "unstable_legacy-backwards":
        for (n = null, u = e.child, e.child = null; u !== null; ) {
          if (t = u.alternate, t !== null && Go(t) === null) {
            e.child = u;
            break;
          }
          t = u.sibling, u.sibling = n, n = u, u = t;
        }
        ac(
          e,
          !0,
          n,
          null,
          c,
          a
        );
        break;
      case "together":
        ac(
          e,
          !1,
          null,
          null,
          void 0,
          a
        );
        break;
      case "independent":
        e.memoizedState = null;
        break;
      default:
        n = zg(e.child), n === null ? (u = e.child, e.child = null) : (u = n.sibling, n.sibling = null), ac(
          e,
          !1,
          u,
          n,
          c,
          a
        );
    }
    return e.child;
  }
  function Cg(t, e, n) {
    var a = e.pendingProps;
    return ml(e, e.type, a.value), ce(t, e, a.children, n), e.child;
  }
  function Pn(t, e, n) {
    if (t !== null && (e.dependencies = t.dependencies), Tl |= e.lanes, (n & e.childLanes) === 0)
      if (t !== null) {
        if (ta(
          t,
          e,
          n,
          !1
        ), (n & e.childLanes) === 0)
          return null;
      } else return null;
    if (t !== null && e.child !== t.child)
      throw Error(r(153));
    if (e.child !== null) {
      for (t = e.child, n = $n(t, t.pendingProps), e.child = n, n.return = e; t.sibling !== null; )
        t = t.sibling, n = n.sibling = $n(t, t.pendingProps), n.return = e;
      n.sibling = null;
    }
    return e.child;
  }
  function ef(t, e) {
    return (t.lanes & e) !== 0 ? !0 : (t = t.dependencies, !!(t !== null && Bo(t)));
  }
  function ix(t, e, n) {
    switch (e.tag) {
      case 3:
        Ie(e, e.stateNode.containerInfo), ml(e, ne, t.memoizedState.cache), Wl();
        break;
      case 27:
      case 5:
        _e(e);
        break;
      case 4:
        Ie(e, e.stateNode.containerInfo);
        break;
      case 10:
        ml(
          e,
          e.type,
          e.memoizedProps.value
        );
        break;
      case 31:
        if (e.memoizedState !== null)
          return e.flags |= 128, Ts(e), null;
        break;
      case 13:
        var a = e.memoizedState;
        if (a !== null) {
          if (a.dehydrated !== null)
            return bl(e), e.flags |= 128, null;
          a = ta(
            t,
            e,
            n,
            !1
          );
          var u = e.child.childLanes;
          return a || (n & u) !== 0 ? Tg(t, e, n) : (bl(e), t = Pn(
            t,
            e,
            n
          ), t !== null ? t.sibling : null);
        }
        bl(e);
        break;
      case 19:
        if (e.flags & 128)
          return tf(
            t,
            e,
            n
          );
        if (u = (t.flags & 128) !== 0, a = (n & e.childLanes) !== 0, a || (ta(
          t,
          e,
          n,
          !1
        ), a = (n & e.childLanes) !== 0), u) {
          if (a)
            return tf(
              t,
              e,
              n
            );
          e.flags |= 128;
        }
        if (u = e.memoizedState, u !== null && (u.rendering = null, u.tail = null, u.lastEffect = null), cu(e, ye.current), a) break;
        return null;
      case 22:
        return e.lanes = 0, xg(
          t,
          e,
          n,
          e.pendingProps
        );
      case 24:
        ml(e, ne, t.memoizedState.cache);
    }
    return Pn(t, e, n);
  }
  function Ag(t, e, n) {
    if (t !== null)
      if (t.memoizedProps !== e.pendingProps)
        ae = !0;
      else {
        if (!ef(t, n) && (e.flags & 128) === 0)
          return ae = !1, ix(
            t,
            e,
            n
          );
        ae = (t.flags & 131072) !== 0;
      }
    else
      ae = !1, zt && (e.flags & 1048576) !== 0 && o0(e, Pi, e.index);
    switch (e.lanes = 0, e.tag) {
      case 16:
        t: {
          var a = e.pendingProps;
          if (t = aa(e.elementType), e.type = t, typeof t == "function")
            cs(t) ? (a = ca(t, a), e.tag = 1, e = wg(
              null,
              e,
              t,
              a,
              n
            )) : (e.tag = 0, e = Js(
              null,
              e,
              t,
              a,
              n
            ));
          else {
            if (t != null) {
              var u = t.$$typeof;
              if (u === O) {
                e.tag = 11, e = vg(
                  null,
                  e,
                  t,
                  a,
                  n
                );
                break t;
              } else if (u === K) {
                e.tag = 14, e = pg(
                  null,
                  e,
                  t,
                  a,
                  n
                );
                break t;
              } else if (u === V) {
                e.tag = 10, e.type = t, e = Cg(
                  null,
                  e,
                  n
                );
                break t;
              }
            }
            throw e = ft(t) || t, Error(r(306, e, ""));
          }
        }
        return e;
      case 0:
        return Js(
          t,
          e,
          e.type,
          e.pendingProps,
          n
        );
      case 1:
        return a = e.type, u = ca(
          a,
          e.pendingProps
        ), wg(
          t,
          e,
          a,
          u,
          n
        );
      case 3:
        t: {
          if (Ie(
            e,
            e.stateNode.containerInfo
          ), t === null) throw Error(r(387));
          a = e.pendingProps;
          var c = e.memoizedState;
          u = c.element, bs(t, e), ou(e, a, null, n);
          var h = e.memoizedState;
          if (a = h.cache, ml(e, ne, a), a !== c.cache && ms(
            e,
            [ne],
            n,
            !0
          ), uu(), a = h.element, c.isDehydrated)
            if (c = {
              element: a,
              isDehydrated: !1,
              cache: h.cache
            }, e.updateQueue.baseState = c, e.memoizedState = c, e.flags & 256) {
              e = Ng(
                t,
                e,
                a,
                n
              );
              break t;
            } else if (a !== u) {
              u = Pe(
                Error(r(424)),
                e
              ), tu(u), e = Ng(
                t,
                e,
                a,
                n
              );
              break t;
            } else
              for (t = e.stateNode.containerInfo, t.nodeType === 9 ? t = t.body : t = t.nodeName === "HTML" ? t.ownerDocument.body : t, Qt = an(t.firstChild), se = e, zt = !0, hl = null, nn = !0, n = x0(
                e,
                null,
                a,
                n
              ), e.child = n; n; )
                n.flags = n.flags & -3 | 134221824, n = n.sibling;
          else {
            if (Wl(), a === u) {
              e = Pn(
                t,
                e,
                n
              );
              break t;
            }
            ce(t, e, a, n);
          }
          e = e.child;
        }
        return e;
      case 26:
        return Fa(t, e), t === null ? (n = ey(
          e.type,
          null,
          e.pendingProps,
          null
        )) ? e.memoizedState = n : zt || (e.stateNode = Hm(
          e.type,
          e.pendingProps,
          re.current,
          e
        )) : e.memoizedState = ey(
          e.type,
          t.memoizedProps,
          e.pendingProps,
          t.memoizedState
        ), null;
      case 27:
        return _e(e), t === null && zt && (a = e.stateNode = Fm(
          e.type,
          e.pendingProps,
          re.current
        ), se = e, nn = !0, u = Qt, Al(e.type) ? (Wf = u, Qt = an(a.firstChild)) : Qt = u), ce(
          t,
          e,
          e.pendingProps.children,
          n
        ), Fa(t, e), t === null && (e.flags |= 4194304), e.child;
      case 5:
        return t === null && zt && ((u = a = Qt) && (a = Px(
          a,
          e.type,
          e.pendingProps,
          nn
        ), a !== null ? (e.stateNode = a, se = e, Qt = an(a.firstChild), nn = !1, u = !0) : u = !1), u || gl(e)), _e(e), u = e.type, c = e.pendingProps, h = t !== null ? t.memoizedProps : null, a = c.children, Zf(u, c) ? a = null : h !== null && Zf(u, h) && (e.flags |= 32), e.memoizedState !== null && (u = Cs(
          t,
          e,
          JS,
          null,
          null,
          n
        ), mi._currentValue = u), Fa(t, e), ce(t, e, a, n), e.child;
      case 6:
        return t === null && zt && ((t = n = Qt) && (n = tb(
          n,
          e.pendingProps,
          nn
        ), n !== null ? (e.stateNode = n, se = e, Qt = null, t = !0) : t = !1), t || gl(e)), null;
      case 13:
        return Tg(t, e, n);
      case 4:
        return Ie(
          e,
          e.stateNode.containerInfo
        ), a = e.pendingProps, t === null ? e.child = ua(
          e,
          null,
          a,
          n
        ) : ce(t, e, a, n), e.child;
      case 11:
        return vg(
          t,
          e,
          e.type,
          e.pendingProps,
          n
        );
      case 7:
        return a = e.pendingProps, Fa(t, e), ce(t, e, a, n), e.child;
      case 8:
        return ce(
          t,
          e,
          e.pendingProps.children,
          n
        ), e.child;
      case 12:
        return ce(
          t,
          e,
          e.pendingProps.children,
          n
        ), e.child;
      case 10:
        return Cg(t, e, n);
      case 9:
        return u = e.type._context, a = e.pendingProps.children, ea(e), u = ge(u), a = a(u), e.flags |= 1, ce(t, e, a, n), e.child;
      case 14:
        return pg(
          t,
          e,
          e.type,
          e.pendingProps,
          n
        );
      case 15:
        return Sg(
          t,
          e,
          e.type,
          e.pendingProps,
          n
        );
      case 19:
        return tf(t, e, n);
      case 31:
        return lx(t, e, n);
      case 22:
        return xg(
          t,
          e,
          n,
          e.pendingProps
        );
      case 24:
        return ea(e), a = ge(ne), t === null ? (u = ps(), u === null && (u = Gt, c = ys(), u.pooledCache = c, c.refCount++, c !== null && (u.pooledCacheLanes |= n), u = c), e.memoizedState = { parent: a, cache: u }, xs(e), ml(e, ne, u)) : ((t.lanes & n) !== 0 && (bs(t, e), ou(e, null, null, n), uu()), u = t.memoizedState, c = e.memoizedState, u.parent !== a ? (u = { parent: a, cache: a }, e.memoizedState = u, e.lanes === 0 && (e.memoizedState = e.updateQueue.baseState = u), ml(e, ne, a)) : (a = c.cache, ml(e, ne, a), a !== u.cache && ms(
          e,
          [ne],
          n,
          !0
        ))), ce(
          t,
          e,
          e.pendingProps.children,
          n
        ), e.child;
      case 30:
        return e.stateNode === null && (e.stateNode = {
          autoName: null,
          paired: null,
          clones: null,
          ref: null
        }), a = e.pendingProps, a.name != null && a.name !== "auto" ? e.flags |= t === null ? 18882560 : 18874368 : zt && Ro(e), t !== null && t.memoizedProps.name !== a.name ? e.flags |= 4194816 : Fa(t, e), ce(t, e, a.children, n), e.child;
      case 29:
        throw e.pendingProps;
    }
    throw Error(r(156, e.tag));
  }
  function tl(t) {
    t.flags |= 4;
  }
  function nf(t, e, n, a, u) {
    var c;
    if ((c = (t.mode & 32) !== 0) && (c = n === null ? iy(e, a) : iy(e, a) && (a.src !== n.src || a.srcSet !== n.srcSet)), c) {
      if (t.flags |= 16777216, (u & 335544128) === u)
        if (t.stateNode.complete) t.flags |= 8192;
        else if (fm()) t.flags |= 8192;
        else
          throw ia = qo, Ss;
    } else t.flags &= -16777217;
  }
  function Og(t, e) {
    if (e.type !== "stylesheet" || (e.state.loading & 4) !== 0)
      t.flags &= -16777217;
    else if (t.flags |= 16777216, !uy(e))
      if (fm()) t.flags |= 8192;
      else
        throw ia = qo, Ss;
  }
  function ic(t, e) {
    e !== null && (t.flags |= 4), t.flags & 16384 && (e = t.tag !== 22 ? Li() : 536870912, t.lanes |= e, ni |= e);
  }
  function hu(t, e) {
    if (!zt)
      switch (t.tailMode) {
        case "visible":
          break;
        case "collapsed":
          for (var n = t.tail, a = null; n !== null; )
            n.alternate !== null && (a = n), n = n.sibling;
          a === null ? e || t.tail === null ? t.tail = null : t.tail.sibling = null : a.sibling = null;
          break;
        default:
          for (e = t.tail, n = null; e !== null; )
            e.alternate !== null && (n = e), e = e.sibling;
          n === null ? t.tail = null : n.sibling = null;
      }
  }
  function Kt(t) {
    var e = t.alternate !== null && t.alternate.child === t.child, n = 0, a = 0;
    if (e)
      for (var u = t.child; u !== null; )
        n |= u.lanes | u.childLanes, a |= u.subtreeFlags & 1206910976, a |= u.flags & 1206910976, u.return = t, u = u.sibling;
    else
      for (u = t.child; u !== null; )
        n |= u.lanes | u.childLanes, a |= u.subtreeFlags, a |= u.flags, u.return = t, u = u.sibling;
    return t.subtreeFlags |= a, t.childLanes = n, e;
  }
  function ux(t, e, n) {
    var a = e.pendingProps;
    switch (fs(e), e.tag) {
      case 16:
      case 15:
      case 0:
      case 11:
      case 7:
      case 8:
      case 12:
      case 9:
      case 14:
        return Kt(e), null;
      case 1:
        return Kt(e), null;
      case 3:
        return n = e.stateNode, a = null, t !== null && (a = t.memoizedState.cache), e.memoizedState.cache !== a && (e.flags |= 2048), kn(ne), Oe(), n.pendingContext && (n.context = n.pendingContext, n.pendingContext = null), (t === null || t.child === null) && (Ga(e) ? tl(e) : t === null || t.memoizedState.isDehydrated && (e.flags & 256) === 0 || (e.flags |= 1024, hs())), Kt(e), null;
      case 26:
        var u = e.type, c = e.memoizedState;
        return t === null ? (tl(e), c !== null ? (Kt(e), Og(e, c)) : (Kt(e), nf(
          e,
          u,
          null,
          a,
          n
        ))) : c ? c !== t.memoizedState ? (tl(e), Kt(e), Og(e, c)) : (Kt(e), e.flags &= -16777217) : (t = t.memoizedProps, t !== a && tl(e), Kt(e), nf(
          e,
          u,
          t,
          a,
          n
        )), null;
      case 27:
        if (De(e), n = re.current, u = e.type, t !== null && e.stateNode != null)
          t.memoizedProps !== a && tl(e);
        else {
          if (!a) {
            if (e.stateNode === null)
              throw Error(r(166));
            return Kt(e), e.subtreeFlags &= -33554433, null;
          }
          t = Pt.current, Ga(e) ? r0(e) : (t = Fm(u, a, n), e.stateNode = t, tl(e));
        }
        return Kt(e), e.subtreeFlags &= -33554433, null;
      case 5:
        if (De(e), u = e.type, t !== null && e.stateNode != null)
          t.memoizedProps !== a && tl(e);
        else {
          if (!a) {
            if (e.stateNode === null)
              throw Error(r(166));
            return Kt(e), e.subtreeFlags &= -33554433, null;
          }
          if (c = Pt.current, Ga(e))
            r0(e);
          else {
            var h = wu(
              re.current
            );
            switch (c) {
              case 1:
                c = h.createElementNS(
                  "http://www.w3.org/2000/svg",
                  u
                );
                break;
              case 2:
                c = h.createElementNS(
                  "http://www.w3.org/1998/Math/MathML",
                  u
                );
                break;
              default:
                switch (u) {
                  case "svg":
                    c = h.createElementNS(
                      "http://www.w3.org/2000/svg",
                      u
                    );
                    break;
                  case "math":
                    c = h.createElementNS(
                      "http://www.w3.org/1998/Math/MathML",
                      u
                    );
                    break;
                  case "script":
                    c = h.createElement("div"), c.innerHTML = "<script><\/script>", c = c.removeChild(
                      c.firstChild
                    );
                    break;
                  case "select":
                    c = typeof a.is == "string" ? h.createElement("select", {
                      is: a.is
                    }) : h.createElement("select"), a.multiple ? c.multiple = !0 : a.size && (c.size = a.size);
                    break;
                  default:
                    c = typeof a.is == "string" ? h.createElement(u, { is: a.is }) : h.createElement(u);
                }
            }
            c[oe] = e, c[be] = a;
            t: for (h = e.child; h !== null; ) {
              if (h.tag === 5 || h.tag === 6)
                c.appendChild(h.stateNode);
              else if (h.tag !== 4 && h.tag !== 27 && h.child !== null) {
                h.child.return = h, h = h.child;
                continue;
              }
              if (h === e) break t;
              for (; h.sibling === null; ) {
                if (h.return === null || h.return === e)
                  break t;
                h = h.return;
              }
              h.sibling.return = h.return, h = h.sibling;
            }
            e.stateNode = c;
            t: switch (pe(c, u, a), u) {
              case "button":
              case "input":
              case "select":
              case "textarea":
                a = !!a.autoFocus;
                break t;
              case "img":
                a = !0;
                break t;
              default:
                a = !1;
            }
            a && tl(e);
          }
        }
        return Kt(e), e.subtreeFlags &= -33554433, nf(
          e,
          e.type,
          t === null ? null : t.memoizedProps,
          e.pendingProps,
          n
        ), null;
      case 6:
        if (t && e.stateNode != null)
          t.memoizedProps !== a && tl(e);
        else {
          if (typeof a != "string" && e.stateNode === null)
            throw Error(r(166));
          if (t = re.current, Ga(e)) {
            if (t = e.stateNode, n = e.memoizedProps, a = null, u = se, u !== null)
              switch (u.tag) {
                case 27:
                case 5:
                  a = u.memoizedProps;
              }
            t[oe] = e, t = !!(t.nodeValue === n || a !== null && a.suppressHydrationWarning === !0 || Am(t.nodeValue, n)), t || gl(e, !0);
          } else
            t = wu(t).createTextNode(
              a
            ), t[oe] = e, e.stateNode = t;
        }
        return Kt(e), null;
      case 31:
        if (n = e.memoizedState, t === null || t.memoizedState !== null) {
          if (a = Ga(e), n !== null) {
            if (t === null) {
              if (!a) throw Error(r(318));
              if (t = e.memoizedState, t = t !== null ? t.dehydrated : null, !t) throw Error(r(557));
              t[oe] = e;
            } else
              Wl(), (e.flags & 128) === 0 && (e.memoizedState = null), e.flags |= 4;
            Kt(e), t = !1;
          } else
            n = hs(), t !== null && t.memoizedState !== null && (t.memoizedState.hydrationErrors = n), t = !0;
          if (!t)
            return e.flags & 256 ? (Xe(e), e) : (Xe(e), null);
          if ((e.flags & 128) !== 0)
            throw Error(r(558));
        }
        return Kt(e), null;
      case 13:
        if (a = e.memoizedState, t === null || t.memoizedState !== null && t.memoizedState.dehydrated !== null) {
          if (u = Ga(e), a !== null && a.dehydrated !== null) {
            if (t === null) {
              if (!u) throw Error(r(318));
              if (u = e.memoizedState, u = u !== null ? u.dehydrated : null, !u) throw Error(r(317));
              u[oe] = e;
            } else
              Wl(), (e.flags & 128) === 0 && (e.memoizedState = null), e.flags |= 4;
            Kt(e), u = !1;
          } else
            u = hs(), t !== null && t.memoizedState !== null && (t.memoizedState.hydrationErrors = u), u = !0;
          if (!u)
            return e.flags & 256 ? (Xe(e), e) : (Xe(e), null);
        }
        return Xe(e), (e.flags & 128) !== 0 ? (e.lanes = n, e) : (n = a !== null, t = t !== null && t.memoizedState !== null, n && (a = e.child, u = null, a.alternate !== null && a.alternate.memoizedState !== null && a.alternate.memoizedState.cachePool !== null && (u = a.alternate.memoizedState.cachePool.pool), c = null, a.memoizedState !== null && a.memoizedState.cachePool !== null && (c = a.memoizedState.cachePool.pool), c !== u && (a.flags |= 2048)), n !== t && n && (e.child.flags |= 8192), ic(e, e.updateQueue), Kt(e), null);
      case 4:
        return Oe(), t === null && Vf(e.stateNode.containerInfo), e.flags |= 67108864, Kt(e), null;
      case 10:
        return kn(e.type), Kt(e), null;
      case 19:
        if (Ms(e), a = e.memoizedState, a === null) return Kt(e), null;
        if (u = (e.flags & 128) !== 0, c = a.rendering, c === null)
          if (u) hu(a, !1);
          else {
            if (Wt !== 0 || t !== null && (t.flags & 128) !== 0)
              for (t = e.child; t !== null; ) {
                if (c = Go(t), c !== null) {
                  for (e.flags |= 128, hu(a, !1), t = c.updateQueue, e.updateQueue = t, ic(e, t), e.subtreeFlags = 0, t = n, n = e.child; n !== null; )
                    a0(n, t), n = n.sibling;
                  return cu(
                    e,
                    ye.current & 1 | 2
                  ), zt && Jn(e, a.treeForkCount), e.child;
                }
                t = t.sibling;
              }
            a.tail !== null && we() > vc && (e.flags |= 128, u = !0, hu(a, !1), e.lanes = 4194304);
          }
        else {
          if (!u)
            if (t = Go(c), t !== null) {
              if (e.flags |= 128, u = !0, t = t.updateQueue, e.updateQueue = t, ic(e, t), hu(a, !0), a.tail === null && a.tailMode !== "collapsed" && a.tailMode !== "visible" && !c.alternate && !zt)
                return Kt(e), null;
            } else
              2 * we() - a.renderingStartTime > vc && n !== 536870912 && (e.flags |= 128, u = !0, hu(a, !1), e.lanes = 4194304);
          a.isBackwards ? (c.sibling = e.child, e.child = c) : (t = a.last, t !== null ? t.sibling = c : e.child = c, a.last = c);
        }
        if (a.tail !== null) {
          t = a.tail;
          t: {
            for (n = t; n !== null; ) {
              if (n.alternate !== null) {
                n = !1;
                break t;
              }
              n = n.sibling;
            }
            n = !0;
          }
          return a.rendering = t, a.tail = t.sibling, a.renderingStartTime = we(), t.sibling = null, c = ye.current, c = u ? c & 1 | 2 : c & 1, a.tailMode === "visible" || a.tailMode === "collapsed" || !n || zt ? cu(e, c) : (n = c, Ot(me, e), Ot(ye, n), Ee === null && (Ee = e)), zt && Jn(e, a.treeForkCount), t;
        }
        return Kt(e), null;
      case 22:
      case 23:
        return Xe(e), Ns(), a = e.memoizedState !== null, t !== null ? t.memoizedState !== null !== a && (e.flags |= 8192) : a && (e.flags |= 8192), a ? (n & 536870912) !== 0 && (e.flags & 128) === 0 && (Kt(e), e.subtreeFlags & 6 && (e.flags |= 8192)) : Kt(e), n = e.updateQueue, n !== null && ic(e, n.retryQueue), n = null, t !== null && t.memoizedState !== null && t.memoizedState.cachePool !== null && (n = t.memoizedState.cachePool.pool), a = null, e.memoizedState !== null && e.memoizedState.cachePool !== null && (a = e.memoizedState.cachePool.pool), a !== n && (e.flags |= 2048), t !== null && Ht(la), null;
      case 24:
        return n = null, t !== null && (n = t.memoizedState.cache), e.memoizedState.cache !== n && (e.flags |= 2048), kn(ne), Kt(e), null;
      case 25:
        return null;
      case 30:
        return e.flags |= 33554432, Kt(e), null;
    }
    throw Error(r(156, e.tag));
  }
  function ox(t, e) {
    switch (fs(e), e.tag) {
      case 1:
        return t = e.flags, t & 65536 ? (e.flags = t & -65537 | 128, e) : null;
      case 3:
        return kn(ne), Oe(), t = e.flags, (t & 65536) !== 0 && (t & 128) === 0 ? (e.flags = t & -65537 | 128, e) : null;
      case 26:
      case 27:
      case 5:
        return De(e), null;
      case 31:
        if (e.memoizedState !== null) {
          if (Xe(e), e.alternate === null)
            throw Error(r(340));
          Wl();
        }
        return t = e.flags, t & 65536 ? (e.flags = t & -65537 | 128, e) : null;
      case 13:
        if (Xe(e), t = e.memoizedState, t !== null && t.dehydrated !== null) {
          if (e.alternate === null)
            throw Error(r(340));
          Wl();
        }
        return t = e.flags, t & 65536 ? (e.flags = t & -65537 | 128, e) : null;
      case 19:
        return Ms(e), t = e.flags, t & 65536 ? (e.flags = t & -65537 | 128, t = e.memoizedState, t !== null && (t.rendering = null, t.tail = null), e.flags |= 4, e) : null;
      case 4:
        return Oe(), null;
      case 10:
        return kn(e.type), null;
      case 22:
      case 23:
        return Xe(e), Ns(), t !== null && Ht(la), t = e.flags, t & 65536 ? (e.flags = t & -65537 | 128, e) : null;
      case 24:
        return kn(ne), null;
      case 25:
        return null;
      default:
        return null;
    }
  }
  function Dg(t, e) {
    switch (fs(e), e.tag) {
      case 3:
        kn(ne), Oe();
        break;
      case 26:
      case 27:
      case 5:
        De(e);
        break;
      case 4:
        Oe();
        break;
      case 31:
        e.memoizedState !== null && Xe(e);
        break;
      case 13:
        Xe(e);
        break;
      case 19:
        Ms(e);
        break;
      case 10:
        kn(e.type);
        break;
      case 22:
      case 23:
        Xe(e), Ns(), t !== null && Ht(la);
        break;
      case 24:
        kn(ne);
    }
  }
  function gu(t, e) {
    try {
      var n = e.updateQueue, a = n !== null ? n.lastEffect : null;
      if (a !== null) {
        var u = a.next;
        n = u;
        do {
          if ((n.tag & t) === t) {
            a = void 0;
            var c = n.create, h = n.inst;
            a = c(), h.destroy = a;
          }
          n = n.next;
        } while (n !== u);
      }
    } catch (x) {
      Xt(e, e.return, x);
    }
  }
  function _l(t, e, n) {
    try {
      var a = e.updateQueue, u = a !== null ? a.lastEffect : null;
      if (u !== null) {
        var c = u.next;
        a = c;
        do {
          if ((a.tag & t) === t) {
            var h = a.inst, x = h.destroy;
            if (x !== void 0) {
              h.destroy = void 0, u = e;
              var z = n, q = x;
              try {
                q();
              } catch ($) {
                Xt(
                  u,
                  z,
                  $
                );
              }
            }
          }
          a = a.next;
        } while (a !== c);
      }
    } catch ($) {
      Xt(e, e.return, $);
    }
  }
  function Rg(t) {
    var e = t.updateQueue;
    if (e !== null) {
      var n = t.stateNode;
      try {
        E0(e, n);
      } catch (a) {
        Xt(t, t.return, a);
      }
    }
  }
  function Hg(t, e, n) {
    n.props = ca(
      t.type,
      t.memoizedProps
    ), n.state = t.memoizedState;
    try {
      n.componentWillUnmount();
    } catch (a) {
      Xt(t, e, a);
    }
  }
  function zn(t, e) {
    try {
      var n = t.ref;
      if (n !== null) {
        switch (t.tag) {
          case 26:
          case 27:
          case 5:
            var a = t.stateNode;
            break;
          case 30:
            var u = t.stateNode, c = Qn(t.memoizedProps, u);
            (u.ref === null || u.ref.name !== c) && (u.ref = Xm(c)), a = u.ref;
            break;
          case 7:
            if (t.stateNode === null) {
              var h = new Ke(t);
              m(
                t.child,
                !1,
                Fx,
                h,
                void 0,
                void 0
              ), t.stateNode = h;
            }
            a = t.stateNode;
            break;
          default:
            a = t.stateNode;
        }
        typeof n == "function" ? t.refCleanup = n(a) : n.current = a;
      }
    } catch (x) {
      Xt(t, e, x);
    }
  }
  function ve(t, e) {
    var n = t.ref, a = t.refCleanup;
    if (n !== null)
      if (typeof a == "function")
        try {
          a();
        } catch (u) {
          Xt(t, e, u);
        } finally {
          t.refCleanup = null, t = t.alternate, t != null && (t.refCleanup = null);
        }
      else if (typeof n == "function")
        try {
          n(null);
        } catch (u) {
          Xt(t, e, u);
        }
      else n.current = null;
  }
  function uc(t, e) {
    if ((t.tag === 5 || t.tag === 27 || t.tag === 6) && t.alternate === null && e !== null)
      for (var n = 0; n < e.length; n++)
        $m(
          t.stateNode,
          e[n]
        );
  }
  function Ug(t) {
    for (var e = t.return; e !== null && (af(e) && $m(t.stateNode, e.stateNode), !lf(e)); )
      e = e.return;
  }
  function mu(t) {
    for (var e = t.return; e !== null && (af(e) && Wx(t.stateNode, e.stateNode), !lf(e)); )
      e = e.return;
  }
  function lf(t) {
    return t.tag === 5 || t.tag === 3 || t.tag === 27;
  }
  function af(t) {
    return t && t.tag === 7 && t.stateNode !== null;
  }
  function uf(t) {
    var e = t.type, n = t.memoizedProps, a = t.stateNode;
    try {
      t: switch (e) {
        case "button":
        case "input":
        case "select":
        case "textarea":
          n.autoFocus && a.focus();
          break t;
        case "img":
          n.src ? a.src = n.src : n.srcSet && (a.srcset = n.srcSet);
      }
    } catch (u) {
      Xt(t, t.return, u);
    }
  }
  function of(t, e, n) {
    try {
      var a = t.stateNode;
      Rx(a, t.type, n, e), a[be] = e;
    } catch (u) {
      Xt(t, t.return, u);
    }
  }
  function Bg(t) {
    return t.tag === 5 || t.tag === 3 || t.tag === 26 || t.tag === 27 && Al(t.type) || t.tag === 4;
  }
  function cf(t) {
    t: for (; ; ) {
      for (; t.sibling === null; ) {
        if (t.return === null || Bg(t.return)) return null;
        t = t.return;
      }
      for (t.sibling.return = t.return, t = t.sibling; t.tag !== 5 && t.tag !== 6 && t.tag !== 18; ) {
        if (t.tag === 27 && Al(t.type) || t.flags & 2 || t.child === null || t.tag === 4) continue t;
        t.child.return = t, t = t.child;
      }
      if (!(t.flags & 2)) return t.stateNode;
    }
  }
  function rf(t, e, n, a) {
    var u = t.tag;
    if (u === 5 || u === 6)
      u = t.stateNode, e ? (n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n).insertBefore(u, e) : (e = n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n, e.appendChild(u), n = n._reactRootContainer, n != null || e.onclick !== null || (e.onclick = Nn)), uc(t, a), Yt = !0;
    else if (u !== 4 && (u === 27 && (uc(t, a), a = null, Al(t.type) && (n = t.stateNode, e = null)), t = t.child, t !== null))
      for (rf(
        t,
        e,
        n,
        a
      ), t = t.sibling; t !== null; )
        rf(
          t,
          e,
          n,
          a
        ), t = t.sibling;
  }
  function oc(t, e, n, a) {
    var u = t.tag;
    if (u === 5 || u === 6)
      u = t.stateNode, e ? n.insertBefore(u, e) : n.appendChild(u), uc(t, a), Yt = !0;
    else if (u !== 4 && (u === 27 && (uc(t, a), a = null, Al(t.type) && (n = t.stateNode)), t = t.child, t !== null))
      for (oc(
        t,
        e,
        n,
        a
      ), t = t.sibling; t !== null; )
        oc(
          t,
          e,
          n,
          a
        ), t = t.sibling;
  }
  function Yg(t) {
    var e = t.stateNode, n = t.memoizedProps;
    try {
      for (var a = t.type, u = e.attributes; u.length; )
        e.removeAttributeNode(u[0]);
      pe(e, a, n), e[oe] = t, e[be] = n;
    } catch (c) {
      Xt(t, t.return, c);
    }
  }
  var cc = !1, je = null;
  function Vg(t) {
    (t.tag === 30 || (t.subtreeFlags & 33554432) !== 0) && (cc = !0);
  }
  var Cn = null;
  function Lg() {
    var t = Cn;
    return Cn = null, t;
  }
  var He = 0;
  function Wa(t, e, n, a, u) {
    return He = 0, qg(
      t.child,
      e,
      n,
      a,
      u
    );
  }
  function qg(t, e, n, a, u) {
    for (var c = !1; t !== null; ) {
      if (t.tag === 5) {
        var h = t.stateNode;
        if (a !== null) {
          var x = Kf(h);
          a.push(x), x.view && (c = !0);
        } else
          c || Kf(h).view && (c = !0);
        cc = !0, Lm(
          h,
          He === 0 ? e : e + "_" + He,
          n
        ), He++;
      } else (t.tag !== 22 || t.memoizedState === null) && (t.tag === 30 && u || qg(
        t.child,
        e,
        n,
        a,
        u
      ) && (c = !0));
      t = t.sibling;
    }
    return c;
  }
  function An(t, e) {
    for (; t !== null; )
      t.tag === 5 ? qm(t.stateNode, t.memoizedProps) : (t.tag !== 22 || t.memoizedState === null) && (t.tag === 30 && e || An(
        t.child,
        e
      )), t = t.sibling;
  }
  function rc(t) {
    if ((t.subtreeFlags & 18874368) !== 0)
      for (t = t.child; t !== null; ) {
        if ((t.tag !== 22 || t.memoizedState === null) && (rc(t), t.tag === 30 && (t.flags & 18874368) !== 0 && t.stateNode.paired)) {
          var e = t.memoizedProps;
          if (e.name == null || e.name === "auto")
            throw Error(r(544));
          var n = e.name;
          e = Kn(e.default, e.share), e !== "none" && (Wa(
            t,
            n,
            e,
            null,
            !1
          ) || An(t.child, !1));
        }
        t = t.sibling;
      }
  }
  function sf(t, e) {
    if (t.tag === 30) {
      var n = t.stateNode, a = t.memoizedProps, u = Qn(a, n), c = Kn(
        a.default,
        n.paired ? a.share : a.enter
      );
      c !== "none" ? Wa(t, u, c, null, !1) ? (rc(t), n.paired || e || ui(t, a.onEnter)) : An(t.child, !1) : rc(t);
    } else if ((t.subtreeFlags & 33554432) !== 0)
      for (t = t.child; t !== null; )
        sf(t, e), t = t.sibling;
    else rc(t);
  }
  function ff(t) {
    if (je !== null && je.size !== 0) {
      var e = je;
      if ((t.subtreeFlags & 18874368) !== 0)
        for (t = t.child; t !== null; ) {
          if (t.tag !== 22 || t.memoizedState === null) {
            if (t.tag === 30 && (t.flags & 18874368) !== 0) {
              var n = t.memoizedProps, a = n.name;
              if (a != null && a !== "auto") {
                var u = e.get(a);
                if (u !== void 0) {
                  var c = Kn(
                    n.default,
                    n.share
                  );
                  if (c !== "none" && (Wa(
                    t,
                    a,
                    c,
                    null,
                    !1
                  ) ? (c = t.stateNode, u.paired = c, c.paired = u, ui(t, n.onShare)) : An(t.child, !1)), e.delete(a), e.size === 0) break;
                }
              }
            }
            ff(t);
          }
          t = t.sibling;
        }
    }
  }
  function df(t) {
    if (t.tag === 30) {
      var e = t.memoizedProps, n = Qn(e, t.stateNode), a = je !== null ? je.get(n) : void 0, u = Kn(
        e.default,
        a !== void 0 ? e.share : e.exit
      );
      u !== "none" && (Wa(t, n, u, null, !1) ? a !== void 0 ? (u = t.stateNode, a.paired = u, u.paired = a, je.delete(n), ui(t, e.onShare)) : ui(t, e.onExit) : An(t.child, !1)), je !== null && ff(t);
    } else if ((t.subtreeFlags & 33554432) !== 0)
      for (t = t.child; t !== null; )
        df(t), t = t.sibling;
    else
      je !== null && ff(t);
  }
  function Xg(t) {
    for (t = t.child; t !== null; ) {
      if (t.tag === 30) {
        var e = t.memoizedProps, n = Qn(e, t.stateNode);
        e = Kn(e.default, e.update), t.flags &= -5, e !== "none" && Wa(
          t,
          n,
          e,
          t.memoizedState = [],
          !1
        );
      } else
        (t.subtreeFlags & 33554432) !== 0 && Xg(t);
      t = t.sibling;
    }
  }
  function hf(t) {
    if ((t.subtreeFlags & 18874368) !== 0)
      for (t = t.child; t !== null; ) {
        if (t.tag !== 22 || t.memoizedState === null) {
          if (t.tag === 30 && (t.flags & 18874368) !== 0) {
            var e = t.stateNode;
            e.paired !== null && (e.paired = null, An(t.child, !1));
          }
          hf(t);
        }
        t = t.sibling;
      }
  }
  function sc(t) {
    if (t.tag === 30)
      t.stateNode.paired = null, An(t.child, !1), hf(t);
    else if ((t.subtreeFlags & 33554432) !== 0)
      for (t = t.child; t !== null; )
        sc(t), t = t.sibling;
    else hf(t);
  }
  function jg(t) {
    for (t = t.child; t !== null; )
      t.tag === 30 ? An(t.child, !1) : (t.subtreeFlags & 33554432) !== 0 && jg(t), t = t.sibling;
  }
  function gf(t, e, n, a, u, c, h) {
    for (var x = !1; e !== null; ) {
      if (e.tag === 5) {
        var z = e.stateNode;
        if (c !== null && He < c.length) {
          var q = c[He], $ = Kf(z);
          (q.view || $.view) && (x = !0);
          var nt;
          if (nt = (t.flags & 4) === 0)
            if ($.clip) nt = !0;
            else {
              nt = q.rect;
              var Y = $.rect;
              nt = nt.y !== Y.y || nt.x !== Y.x || nt.height !== Y.height || nt.width !== Y.width;
            }
          nt && (t.flags |= 4), $.abs ? $ = !q.abs : (q = q.rect, $ = $.rect, $ = q.height !== $.height || q.width !== $.width), $ && (t.flags |= 32);
        } else t.flags |= 32;
        (t.flags & 4) !== 0 && Lm(
          z,
          He === 0 ? n : n + "_" + He,
          u
        ), x && (t.flags & 4) !== 0 || (Cn === null && (Cn = []), Cn.push(
          z,
          He === 0 ? a : a + "_" + He,
          e.memoizedProps
        )), He++;
      } else (e.tag !== 22 || e.memoizedState === null) && (e.tag === 30 && h ? t.flags |= e.flags & 32 : gf(
        t,
        e.child,
        n,
        a,
        u,
        c,
        h
      ) && (x = !0));
      e = e.sibling;
    }
    return x;
  }
  function Zg(t, e) {
    for (t = t.child; t !== null; ) {
      if (t.tag === 30) {
        var n = t.memoizedProps, a = t.stateNode, u = Qn(n, a), c = Kn(n.default, n.update), h;
        h = t.memoizedState, t.memoizedState = null, a = t;
        var x = t.child;
        He = 0, u = gf(
          a,
          x,
          u,
          u,
          c,
          h,
          !1
        ), (t.flags & 4) !== 0 && u && ui(t, n.onUpdate);
      } else
        (t.subtreeFlags & 33554432) !== 0 && Zg(t);
      t = t.sibling;
    }
  }
  var fe = !1, Lt = !1, On = !1, mf = !1, Gg = typeof WeakSet == "function" ? WeakSet : Set, de = null, Dn = !1, yu = !1, fc = !1, yf = !1;
  function cx(t, e, n) {
    if (t = t.containerInfo, Xf = yi, t = Jh(t), es(t)) {
      if ("selectionStart" in t)
        var a = {
          start: t.selectionStart,
          end: t.selectionEnd
        };
      else
        t: {
          a = (a = t.ownerDocument) && a.defaultView || window;
          var u = a.getSelection && a.getSelection();
          if (u && u.rangeCount !== 0) {
            a = u.anchorNode;
            var c = u.anchorOffset, h = u.focusNode;
            u = u.focusOffset;
            try {
              a.nodeType, h.nodeType;
            } catch {
              a = null;
              break t;
            }
            var x = 0, z = -1, q = -1, $ = 0, nt = 0, Y = t, Q = null;
            e: for (; ; ) {
              for (var ht; Y !== a || c !== 0 && Y.nodeType !== 3 || (z = x + c), Y !== h || u !== 0 && Y.nodeType !== 3 || (q = x + u), Y.nodeType === 3 && (x += Y.nodeValue.length), (ht = Y.firstChild) !== null; )
                Q = Y, Y = ht;
              for (; ; ) {
                if (Y === t) break e;
                if (Q === a && ++$ === c && (z = x), Q === h && ++nt === u && (q = x), (ht = Y.nextSibling) !== null) break;
                Y = Q, Q = Y.parentNode;
              }
              Y = ht;
            }
            a = z === -1 || q === -1 ? null : { start: z, end: q };
          } else a = null;
        }
      a = a || { start: 0, end: 0 };
    } else a = null;
    for (jf = { focusedElem: t, selectionRange: a }, yi = !1, n = (n & 335544064) === n, de = e, e = n ? 9270 : 1024; de !== null; ) {
      if (t = de, n && (a = t.deletions, a !== null))
        for (c = 0; c < a.length; c++)
          n && df(a[c]);
      if (t.alternate === null && (t.flags & 2) !== 0)
        n && Vg(t), dc(n);
      else {
        if (t.tag === 22) {
          if (a = t.alternate, t.memoizedState !== null) {
            a !== null && a.memoizedState === null && n && df(a), dc(n);
            continue;
          } else if (a !== null && a.memoizedState !== null) {
            n && Vg(t), dc(n);
            continue;
          }
        }
        a = t.child, (t.subtreeFlags & e) !== 0 && a !== null ? (a.return = t, de = a) : (n && Xg(t), dc(n));
      }
    }
    je = null;
  }
  function dc(t) {
    for (; de !== null; ) {
      var e = de, n = t, a = e.alternate, u = e.flags;
      switch (e.tag) {
        case 0:
        case 11:
        case 15:
          break;
        case 1:
          if ((u & 1024) !== 0 && a !== null) {
            n = void 0, u = a.memoizedProps, a = a.memoizedState;
            var c = e.stateNode;
            try {
              var h = ca(
                e.type,
                u
              );
              n = c.getSnapshotBeforeUpdate(
                h,
                a
              ), c.__reactInternalSnapshotBeforeUpdate = n;
            } catch (x) {
              Xt(e, e.return, x);
            }
          }
          break;
        case 3:
          if ((u & 1024) !== 0) {
            if (a = e.stateNode.containerInfo, n = a.nodeType, n === 9)
              If(a);
            else if (n === 1)
              switch (a.nodeName) {
                case "HEAD":
                case "HTML":
                case "BODY":
                  If(a);
                  break;
                default:
                  a.textContent = "";
              }
          }
          break;
        case 5:
        case 26:
        case 27:
        case 6:
        case 4:
        case 17:
          break;
        case 30:
          n && a !== null && (n = Qn(
            a.memoizedProps,
            a.stateNode
          ), u = e.memoizedProps, u = Kn(u.default, u.update), u !== "none" && Wa(
            a,
            n,
            u,
            a.memoizedState = [],
            !0
          ));
          break;
        default:
          if ((u & 1024) !== 0) throw Error(r(163));
      }
      if (a = e.sibling, a !== null) {
        a.return = e.return, de = a;
        break;
      }
      de = e.return;
    }
  }
  function Qg(t, e, n) {
    var a = n.flags;
    switch (n.tag) {
      case 0:
      case 11:
      case 15:
        Rn(t, n), a & 4 && gu(5, n);
        break;
      case 1:
        if (Rn(t, n), a & 4)
          if (t = n.stateNode, e === null)
            try {
              t.componentDidMount();
            } catch (h) {
              Xt(n, n.return, h);
            }
          else {
            var u = ca(
              n.type,
              e.memoizedProps
            );
            e = e.memoizedState;
            try {
              t.componentDidUpdate(
                u,
                e,
                t.__reactInternalSnapshotBeforeUpdate
              );
            } catch (h) {
              Xt(
                n,
                n.return,
                h
              );
            }
          }
        a & 64 && Rg(n), a & 512 && zn(n, n.return);
        break;
      case 3:
        if (Rn(t, n), a & 64 && (t = n.updateQueue, t !== null)) {
          if (e = null, n.child !== null)
            switch (n.child.tag) {
              case 27:
              case 5:
                e = n.child.stateNode;
                break;
              case 1:
                e = n.child.stateNode;
            }
          try {
            E0(t, e);
          } catch (h) {
            Xt(n, n.return, h);
          }
        }
        break;
      case 27:
        e === null && a & 4 && Yg(n);
      case 26:
      case 5:
        Rn(t, n), e === null && a & 4 && uf(n), a & 512 && zn(n, n.return);
        break;
      case 12:
        Rn(t, n);
        break;
      case 31:
        Rn(t, n), a & 4 && Ig(t, n);
        break;
      case 13:
        Rn(t, n), a & 4 && kg(t, n), a & 64 && (t = n.memoizedState, t !== null && (t = t.dehydrated, t !== null && (n = xx.bind(
          null,
          n
        ), eb(t, n))));
        break;
      case 22:
        if (a = n.memoizedState !== null || fe, !a) {
          var c = e !== null && e.memoizedState !== null || Lt;
          e = fe, u = Lt, fe = a, (Lt = c) && !u ? (a = 2, (n.subtreeFlags & 8772) !== 0 && (a |= 1), dn(
            t,
            n,
            a
          )) : Rn(t, n), fe = e, Lt = u;
        }
        break;
      case 30:
        Rn(t, n), a & 512 && zn(n, n.return);
        break;
      case 7:
        a & 512 && zn(n, n.return);
      default:
        Rn(t, n);
    }
  }
  function vf(t, e) {
    for (t = t.child; t !== null; )
      Kg(t, e), t = t.sibling;
  }
  function Kg(t, e) {
    switch (t.tag) {
      case 5:
      case 26:
        try {
          var n = t.stateNode;
          if (e) {
            var a = n.style;
            typeof a.setProperty == "function" ? a.setProperty("display", "none", "important") : a.display = "none";
          } else {
            var u = t.stateNode, c = t.memoizedProps.style, h = c != null && c.hasOwnProperty("display") ? c.display : null;
            u.style.display = h == null || typeof h == "boolean" ? "" : ("" + h).trim();
          }
        } catch (z) {
          Xt(t, t.return, z);
        }
        pf(t, e);
        break;
      case 6:
        try {
          t.stateNode.nodeValue = e ? "" : t.memoizedProps, Yt = !0;
        } catch (z) {
          Xt(t, t.return, z);
        }
        break;
      case 18:
        try {
          var x = t.stateNode;
          e ? Vm(x, !0) : Vm(t.stateNode, !1);
        } catch (z) {
          Xt(t, t.return, z);
        }
        break;
      case 22:
      case 23:
        t.memoizedState === null && vf(t, e);
        break;
      default:
        vf(t, e);
    }
  }
  function pf(t, e) {
    if (t.subtreeFlags & 67108864)
      for (t = t.child; t !== null; ) {
        t: {
          var n = t, a = e;
          switch (n.tag) {
            case 4:
              Kg(n, a);
              break t;
            case 22:
              n.memoizedState === null && pf(n, a);
              break t;
            default:
              pf(n, a);
          }
        }
        t = t.sibling;
      }
  }
  function $g(t) {
    var e = t.alternate;
    e !== null && (t.alternate = null, $g(e)), t.child = null, t.deletions = null, t.sibling = null, t.tag === 5 && (e = t.stateNode, e !== null && Da(e)), t.stateNode = null, t.return = null, t.dependencies = null, t.memoizedProps = null, t.memoizedState = null, t.pendingProps = null, t.stateNode = null, t.updateQueue = null;
  }
  var Jt = null, Ue = !1;
  function sn(t, e, n) {
    for (n = n.child; n !== null; )
      Jg(t, e, n), n = n.sibling;
  }
  function Jg(t, e, n) {
    if (Ne && typeof Ne.onCommitFiberUnmount == "function")
      try {
        Ne.onCommitFiberUnmount(Zl, n);
      } catch {
      }
    switch (n.tag) {
      case 26:
        Lt || ve(n, e), sn(
          t,
          e,
          n
        ), n.memoizedState ? n.memoizedState.count-- : n.stateNode && !Lt && (n = n.stateNode, n.parentNode.removeChild(n));
        break;
      case 27:
        Lt || ve(n, e), mu(n);
        var a = Jt, u = Ue;
        Al(n.type) && (Jt = n.stateNode, Ue = !1), sn(
          t,
          e,
          n
        ), Wm(
          n.stateNode,
          n.type,
          n.memoizedProps
        ), Jt = a, Ue = u;
        break;
      case 5:
        Lt || ve(n, e), mu(n);
      case 6:
        if (n.tag === 6 && mu(n), a = Jt, u = Ue, Jt = null, sn(
          t,
          e,
          n
        ), Jt = a, Ue = u, Jt !== null)
          if (Ue)
            try {
              (Jt.nodeType === 9 ? Jt.body : Jt.nodeName === "HTML" ? Jt.ownerDocument.body : Jt).removeChild(n.stateNode), Yt = !0;
            } catch (c) {
              Xt(
                n,
                e,
                c
              );
            }
          else
            try {
              Jt.removeChild(n.stateNode), Yt = !0;
            } catch (c) {
              Xt(
                n,
                e,
                c
              );
            }
        break;
      case 18:
        Jt !== null && (Ue ? (t = Jt, Ym(
          t.nodeType === 9 ? t.body : t.nodeName === "HTML" ? t.ownerDocument.body : t,
          n.stateNode
        ), vi(t)) : Ym(Jt, n.stateNode));
        break;
      case 4:
        a = Jt, u = Ue, Jt = n.stateNode.containerInfo, Ue = !0, sn(
          t,
          e,
          n
        ), Jt = a, Ue = u;
        break;
      case 0:
      case 11:
      case 14:
      case 15:
        _l(2, n, e), Lt || _l(4, n, e), sn(
          t,
          e,
          n
        );
        break;
      case 1:
        Lt || (ve(n, e), a = n.stateNode, typeof a.componentWillUnmount == "function" && Hg(
          n,
          e,
          a
        )), sn(
          t,
          e,
          n
        );
        break;
      case 21:
        sn(
          t,
          e,
          n
        );
        break;
      case 22:
        Lt = (a = Lt) || n.memoizedState !== null, sn(
          t,
          e,
          n
        ), Lt = a;
        break;
      case 30:
        ve(n, e), sn(
          t,
          e,
          n
        );
        break;
      case 7:
        Lt || ve(n, e), sn(
          t,
          e,
          n
        );
        break;
      default:
        sn(
          t,
          e,
          n
        );
    }
  }
  function Ig(t, e) {
    if (e.memoizedState === null && (t = e.alternate, t !== null && (t = t.memoizedState, t !== null))) {
      t = t.dehydrated;
      try {
        vi(t);
      } catch (n) {
        Xt(e, e.return, n);
      }
    }
  }
  function kg(t, e) {
    if (e.memoizedState === null && (t = e.alternate, t !== null && (t = t.memoizedState, t !== null && (t = t.dehydrated, t !== null))))
      try {
        vi(t);
      } catch (n) {
        Xt(e, e.return, n);
      }
  }
  function rx(t) {
    switch (t.tag) {
      case 31:
      case 13:
      case 19:
        var e = t.stateNode;
        return e === null && (e = t.stateNode = new Gg()), e;
      case 22:
        return t = t.stateNode, e = t._retryCache, e === null && (e = t._retryCache = new Gg()), e;
      default:
        throw Error(r(435, t.tag));
    }
  }
  function hc(t, e) {
    var n = rx(t);
    e.forEach(function(a) {
      if (!n.has(a)) {
        n.add(a);
        var u = bx.bind(null, t, a);
        a.then(u, u);
      }
    });
  }
  function Ce(t, e, n) {
    var a = e.deletions;
    if (a !== null)
      for (var u = 0; u < a.length; u++) {
        var c = a[u], h = t, x = e, z = x;
        t: for (; z !== null; ) {
          switch (z.tag) {
            case 27:
              if (Al(z.type)) {
                Jt = z.stateNode, Ue = !1;
                break t;
              }
              break;
            case 5:
              Jt = z.stateNode, Ue = !1;
              break t;
            case 3:
            case 4:
              Jt = z.stateNode.containerInfo, Ue = !0;
              break t;
          }
          z = z.return;
        }
        if (Jt === null) throw Error(r(160));
        Jg(h, x, c), Jt = null, Ue = !1, h = c.alternate, h !== null && (h.return = null), c.return = null;
      }
    if (e.subtreeFlags & 13886)
      for (e = e.child; e !== null; )
        Fg(e, t, n), e = e.sibling;
  }
  var fn = null;
  function Fg(t, e, n) {
    var a = t.alternate, u = t.flags;
    switch (t.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        if (u & 4 && (a = t.updateQueue, a = a !== null ? a.events : null, a !== null))
          for (var c = 0; c < a.length; c++) {
            var h = a[c];
            h.ref.impl = h.nextImpl;
          }
        Ce(e, t, n), Ae(t), u & 4 && (_l(3, t, t.return), gu(3, t), _l(5, t, t.return));
        break;
      case 1:
        Ce(e, t, n), Ae(t), u & 512 && (Lt || a === null || ve(a, a.return)), u & 64 && fe && (t = t.updateQueue, t !== null && (e = t.callbacks, e !== null && (n = t.shared.hiddenCallbacks, t.shared.hiddenCallbacks = n === null ? e : n.concat(e))));
        break;
      case 26:
        if (c = fn, Ce(e, t, n), Ae(t), u & 512 && (Lt || a === null || ve(a, a.return)), u & 4)
          if (u = a !== null ? a.memoizedState : null, n = t.memoizedState, a === null)
            if (n === null)
              if (t.stateNode === null)
                if (fe)
                  t.stateNode = Hm(
                    t.type,
                    t.memoizedProps,
                    e.containerInfo,
                    t
                  );
                else {
                  t: {
                    e = t.type, n = t.memoizedProps, u = c.ownerDocument || c;
                    e: switch (e) {
                      case "title":
                        a = u.getElementsByTagName("title")[0], (!a || a[Kl] || a[oe] || a.namespaceURI === "http://www.w3.org/2000/svg" || a.hasAttribute("itemprop")) && (a = u.createElement(e), u.head.insertBefore(
                          a,
                          u.querySelector("head > title")
                        )), pe(a, e, n), a[oe] = t, ee(a), e = a;
                        break t;
                      case "link":
                        if (c = ay(
                          "link",
                          "href",
                          u
                        ).get(e + (n.href || ""))) {
                          for (h = 0; h < c.length; h++)
                            if (a = c[h], a.getAttribute("href") === (n.href == null || n.href === "" ? null : n.href) && a.getAttribute("rel") === (n.rel == null ? null : n.rel) && a.getAttribute("title") === (n.title == null ? null : n.title) && a.getAttribute("crossorigin") === (n.crossOrigin == null ? null : n.crossOrigin)) {
                              c.splice(h, 1);
                              break e;
                            }
                        }
                        a = u.createElement(e), pe(a, e, n), u.head.appendChild(a);
                        break;
                      case "meta":
                        if (c = ay(
                          "meta",
                          "content",
                          u
                        ).get(e + (n.content || ""))) {
                          for (h = 0; h < c.length; h++)
                            if (a = c[h], a.getAttribute("content") === (n.content == null ? null : "" + n.content) && a.getAttribute("name") === (n.name == null ? null : n.name) && a.getAttribute("property") === (n.property == null ? null : n.property) && a.getAttribute("http-equiv") === (n.httpEquiv == null ? null : n.httpEquiv) && a.getAttribute("charset") === (n.charSet == null ? null : n.charSet)) {
                              c.splice(h, 1);
                              break e;
                            }
                        }
                        a = u.createElement(e), pe(a, e, n), u.head.appendChild(a);
                        break;
                      default:
                        throw Error(r(468, e));
                    }
                    a[oe] = t, ee(a), e = a;
                  }
                  t.stateNode = e;
                }
              else
                fe || nd(c, t.type, t.stateNode);
            else
              t.stateNode = ly(
                c,
                n,
                t.memoizedProps
              );
          else
            u !== n ? (u === null ? (e = a.stateNode, e === null || Lt || e.parentNode.removeChild(e)) : u.count--, n === null ? fe || nd(c, t.type, t.stateNode) : ly(c, n, t.memoizedProps)) : n === null && t.stateNode !== null && of(
              t,
              t.memoizedProps,
              a.memoizedProps
            );
        break;
      case 27:
        Ce(e, t, n), Ae(t), u & 512 && (Lt || a === null || ve(a, a.return)), a !== null && u & 4 && of(
          t,
          t.memoizedProps,
          a.memoizedProps
        );
        break;
      case 5:
        if (c = On, On = !1, Ce(e, t, n), On = c, Ae(t), u & 512 && (Lt || a === null || ve(a, a.return)), t.flags & 32) {
          e = t.stateNode;
          try {
            Ha(e, ""), Yt = !0;
          } catch ($) {
            Xt(t, t.return, $);
          }
        }
        u & 4 && t.stateNode != null && (e = t.memoizedProps, of(
          t,
          e,
          a !== null ? a.memoizedProps : e
        )), u & 1024 && (mf = !0);
        break;
      case 6:
        if (Ce(e, t, n), Ae(t), u & 4) {
          if (t.stateNode === null)
            throw Error(r(162));
          e = t.memoizedProps, n = t.stateNode;
          try {
            n.nodeValue = e, Yt = !0;
          } catch ($) {
            Xt(t, t.return, $);
          }
        }
        break;
      case 3:
        if (Yt = !1, zc = null, c = fn, fn = Nu(e.containerInfo), Ce(e, t, n), fn = c, Ae(t), u & 4 && a !== null && a.memoizedState.isDehydrated)
          try {
            vi(e.containerInfo);
          } catch ($) {
            Xt(t, t.return, $);
          }
        mf && (mf = !1, Wg(t)), Yt = !1;
        break;
      case 4:
        u = On, On = fe, a = ph(), c = fn, fn = Nu(
          t.stateNode.containerInfo
        ), Ce(e, t, n), Ae(t), fn = c, Yt && yu && (fc = !0), Yt = a, On = u;
        break;
      case 12:
        Ce(e, t, n), Ae(t);
        break;
      case 31:
        Ce(e, t, n), Ae(t), u & 4 && (e = t.updateQueue, e !== null && (t.updateQueue = null, hc(t, e)));
        break;
      case 13:
        Ce(e, t, n), Ae(t), t.child.flags & 8192 && t.memoizedState !== null != (a !== null && a.memoizedState !== null) && (yc = we()), u & 4 && (e = t.updateQueue, e !== null && (t.updateQueue = null, hc(t, e)));
        break;
      case 22:
        c = t.memoizedState !== null, h = a !== null && a.memoizedState !== null;
        var x = fe, z = Lt, q = On;
        fe = x || c, On = q || c, Lt = z || h, Ce(e, t, n), Lt = z, On = q, fe = x, Ae(t), u & 8192 && (e = t.stateNode, e._visibility = c ? e._visibility & -2 : e._visibility | 1, !c || a === null || h || fe || Lt || (e = h || Lt, n = fe, a = Lt, fe = c || fe, Lt = e, wl(t, 2), fe = n, Lt = a), !c && On || vf(t, c)), u & 4 && (e = t.updateQueue, e !== null && (n = e.retryQueue, n !== null && (e.retryQueue = null, hc(t, n))));
        break;
      case 19:
        Ce(e, t, n), Ae(t), u & 4 && (e = t.updateQueue, e !== null && (t.updateQueue = null, hc(t, e)));
        break;
      case 30:
        u & 512 && (Lt || a === null || ve(a, a.return)), u = ph(), c = yu, h = (n & 335544064) === n, x = t.memoizedProps, yu = h && Kn(
          x.default,
          x.update
        ) !== "none", Ce(e, t, n), Ae(t), h && a !== null && Yt && (t.flags |= 4), yu = c, Yt = u;
        break;
      case 21:
        break;
      case 7:
        u & 512 && (Lt || a === null || ve(a, a.return)), a && a.stateNode !== null && (a.stateNode._fragmentFiber = t);
      default:
        Ce(e, t, n), Ae(t);
    }
  }
  function Ae(t) {
    var e = t.flags;
    if (e & 2) {
      try {
        for (var n, a = t.return; a !== null; ) {
          if (Bg(a)) {
            n = a;
            break;
          }
          a = a.return;
        }
        a = null;
        for (var u = t.return; u !== null; ) {
          if (af(u)) {
            var c = u.stateNode;
            a === null ? a = [c] : a.push(c);
          }
          if (lf(u)) break;
          u = u.return;
        }
        var h = a;
        if (n == null) throw Error(r(160));
        switch (n.tag) {
          case 27:
            var x = n.stateNode, z = cf(t);
            oc(
              t,
              z,
              x,
              h
            );
            break;
          case 5:
            var q = n.stateNode;
            n.flags & 32 && (Ha(q, ""), n.flags &= -33);
            var $ = cf(t);
            oc(
              t,
              $,
              q,
              h
            );
            break;
          case 3:
          case 4:
            var nt = n.stateNode.containerInfo, Y = cf(t);
            rf(
              t,
              Y,
              nt,
              h
            );
            break;
          default:
            throw Error(r(161));
        }
      } catch (Q) {
        Xt(t, t.return, Q);
      }
      t.flags &= -3;
    }
    e & 4096 && (t.flags &= -4097);
  }
  function Wg(t) {
    if (t.subtreeFlags & 1024)
      for (t = t.child; t !== null; ) {
        var e = t;
        Wg(e), e.tag === 5 && e.flags & 1024 && (e = e.stateNode, yi = !0, e.reset(), yi = !1), t = t.sibling;
      }
  }
  function Pa(t, e) {
    if (e.subtreeFlags & 9270)
      for (e = e.child; e !== null; )
        Pg(e, t), e = e.sibling;
    else Zg(e);
  }
  function Pg(t, e) {
    var n = t.alternate;
    if (n === null) sf(t, !1);
    else
      switch (t.tag) {
        case 3:
          if (yf = Dn = !1, Lg(), Pa(e, t), !Dn && !fc) {
            if (t = Cn, t !== null)
              for (var a = 0; a < t.length; a += 3) {
                n = t[a];
                var u = t[a + 1];
                qm(n, t[a + 2]), n = n.ownerDocument.documentElement, n !== null && n.animate(
                  { opacity: [0, 0], pointerEvents: ["none", "none"] },
                  {
                    duration: 0,
                    fill: "forwards",
                    pseudoElement: "::view-transition-group(" + u + ")"
                  }
                );
              }
            t = e.containerInfo, t = t.nodeType === 9 ? t.documentElement : t.ownerDocument.documentElement, t !== null && t.style.viewTransitionName === "" && (t.style.viewTransitionName = "none", t.animate(
              { opacity: [0, 0], pointerEvents: ["none", "none"] },
              {
                duration: 0,
                fill: "forwards",
                pseudoElement: "::view-transition-group(root)"
              }
            ), t.animate(
              { width: [0, 0], height: [0, 0] },
              {
                duration: 0,
                fill: "forwards",
                pseudoElement: "::view-transition"
              }
            )), yf = !0;
          }
          Cn = null;
          break;
        case 5:
          Pa(e, t);
          break;
        case 4:
          a = Dn, Dn = !1, Pa(e, t), Dn && (fc = !0), Dn = a;
          break;
        case 22:
          t.memoizedState === null && (n.memoizedState !== null ? sf(t, !1) : Pa(e, t));
          break;
        case 30:
          a = Dn, u = Lg(), Dn = !1, Pa(e, t), Dn && (t.flags |= 4);
          var c = t.memoizedProps, h = t.stateNode;
          e = Qn(c, h), h = Qn(n.memoizedProps, h);
          var x = Kn(c.default, c.update);
          x === "none" ? e = !1 : (c = n.memoizedState, n.memoizedState = null, n = t.child, He = 0, e = gf(
            t,
            n,
            e,
            h,
            x,
            c,
            !0
          ), He !== (c === null ? 0 : c.length) && (t.flags |= 32)), (t.flags & 4) !== 0 && e ? (ui(
            t,
            t.memoizedProps.onUpdate
          ), Cn = u) : u !== null && (u.push.apply(u, Cn), Cn = u), Dn = (t.flags & 32) !== 0 ? !0 : a;
          break;
        default:
          Pa(e, t);
      }
  }
  function Rn(t, e) {
    if (e.subtreeFlags & 8772)
      for (e = e.child; e !== null; )
        Qg(t, e.alternate, e), e = e.sibling;
  }
  function wl(t, e) {
    for (t = t.child; t !== null; ) {
      var n = t, a = e;
      switch (n.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
          _l(4, n, n.return), wl(
            n,
            a
          );
          break;
        case 1:
          ve(n, n.return);
          var u = n.stateNode;
          typeof u.componentWillUnmount == "function" && Hg(
            n,
            n.return,
            u
          ), wl(
            n,
            a
          );
          break;
        case 27:
          (a & 2) !== 0 && Wm(
            n.stateNode,
            n.type,
            n.memoizedProps
          );
        case 5:
          ve(n, n.return), n.tag !== 5 && n.tag !== 27 || mu(n), wl(
            n,
            a
          );
          break;
        case 6:
          mu(n);
          break;
        case 26:
          ve(n, n.return), u = n.stateNode, n.memoizedState !== null || u === null || Lt || u.parentNode.removeChild(u), wl(
            n,
            a
          );
          break;
        case 22:
          n.memoizedState === null && wl(
            n,
            a
          );
          break;
        case 30:
          ve(n, n.return), wl(
            n,
            a
          );
          break;
        case 7:
          ve(n, n.return);
        default:
          wl(
            n,
            a
          );
      }
      t = t.sibling;
    }
  }
  function dn(t, e, n) {
    for (n = (e.subtreeFlags & 8772) !== 0 ? n : n & -2, e = e.child; e !== null; ) {
      var a = e.alternate, u = t, c = e, h = c.flags, x = (n & 1) !== 0;
      switch (c.tag) {
        case 0:
        case 11:
        case 15:
          dn(
            u,
            c,
            n
          ), gu(4, c);
          break;
        case 1:
          if (dn(
            u,
            c,
            n
          ), a = c, u = a.stateNode, typeof u.componentDidMount == "function")
            try {
              u.componentDidMount();
            } catch ($) {
              Xt(a, a.return, $);
            }
          if (a = c, u = a.updateQueue, u !== null) {
            var z = a.stateNode;
            try {
              var q = u.shared.hiddenCallbacks;
              if (q !== null)
                for (u.shared.hiddenCallbacks = null, u = 0; u < q.length; u++)
                  b0(q[u], z);
            } catch ($) {
              Xt(a, a.return, $);
            }
          }
          x && h & 64 && Rg(c), zn(c, c.return);
          break;
        case 27:
          (n & 2) !== 0 && Yg(c);
        case 5:
          c.tag !== 5 && c.tag !== 27 || Ug(c), dn(
            u,
            c,
            n
          ), x && a === null && h & 4 && uf(c), zn(c, c.return);
          break;
        case 6:
          Ug(c);
          break;
        case 26:
          z = c.stateNode, c.memoizedState !== null || z === null || fe || nd(
            Nu(z.ownerDocument),
            c.type,
            z
          ), dn(
            u,
            c,
            n
          ), x && a === null && h & 4 && uf(c), zn(c, c.return);
          break;
        case 12:
          dn(
            u,
            c,
            n
          );
          break;
        case 31:
          dn(
            u,
            c,
            n
          ), x && h & 4 && Ig(u, c);
          break;
        case 13:
          dn(
            u,
            c,
            n
          ), x && h & 4 && kg(u, c);
          break;
        case 22:
          c.memoizedState === null && dn(
            u,
            c,
            n
          ), zn(c, c.return);
          break;
        case 30:
          dn(
            u,
            c,
            n
          ), zn(c, c.return);
          break;
        case 7:
          zn(c, c.return);
        default:
          dn(
            u,
            c,
            n
          );
      }
      e = e.sibling;
    }
  }
  function Sf(t, e) {
    var n = null;
    t !== null && t.memoizedState !== null && t.memoizedState.cachePool !== null && (n = t.memoizedState.cachePool.pool), t = null, e.memoizedState !== null && e.memoizedState.cachePool !== null && (t = e.memoizedState.cachePool.pool), t !== n && (t != null && t.refCount++, n != null && eu(n));
  }
  function xf(t, e) {
    t = null, e.alternate !== null && (t = e.alternate.memoizedState.cache), e = e.memoizedState.cache, e !== t && (e.refCount++, t != null && eu(t));
  }
  function ln(t, e, n, a) {
    var u = (n & 335544064) === n;
    if (e.subtreeFlags & (u ? 10262 : 10256))
      for (e = e.child; e !== null; )
        tm(
          t,
          e,
          n,
          a
        ), e = e.sibling;
    else u && jg(e);
  }
  function tm(t, e, n, a) {
    var u = (n & 335544064) === n;
    u && e.alternate === null && e.return !== null && e.return.alternate !== null && sc(e);
    var c = e.flags;
    switch (e.tag) {
      case 0:
      case 11:
      case 15:
        ln(
          t,
          e,
          n,
          a
        ), c & 2048 && gu(9, e);
        break;
      case 1:
        ln(
          t,
          e,
          n,
          a
        );
        break;
      case 3:
        ln(
          t,
          e,
          n,
          a
        ), u && yf && (t = t.containerInfo, t = t.nodeType === 9 ? t.body : t.nodeName === "HTML" ? t.ownerDocument.body : t, t.style.viewTransitionName === "root" && (t.style.viewTransitionName = ""), t = t.ownerDocument.documentElement, t !== null && t.style.viewTransitionName === "none" && (t.style.viewTransitionName = "")), c & 2048 && (c = null, e.alternate !== null && (c = e.alternate.memoizedState.cache), e = e.memoizedState.cache, e !== c && (e.refCount++, c != null && eu(c)));
        break;
      case 12:
        if (c & 2048) {
          ln(
            t,
            e,
            n,
            a
          ), c = e.stateNode;
          try {
            var h = e.memoizedProps, x = h.id, z = h.onPostCommit;
            typeof z == "function" && z(
              x,
              e.alternate === null ? "mount" : "update",
              c.passiveEffectDuration,
              -0
            );
          } catch (q) {
            Xt(e, e.return, q);
          }
        } else
          ln(
            t,
            e,
            n,
            a
          );
        break;
      case 31:
        ln(
          t,
          e,
          n,
          a
        );
        break;
      case 13:
        ln(
          t,
          e,
          n,
          a
        );
        break;
      case 23:
        break;
      case 22:
        h = e.stateNode, x = e.alternate, e.memoizedState !== null ? (u && x !== null && x.memoizedState === null && sc(x), h._visibility & 2 ? ln(
          t,
          e,
          n,
          a
        ) : vu(
          t,
          e
        )) : (u && x !== null && x.memoizedState !== null && sc(e), h._visibility & 2 ? ln(
          t,
          e,
          n,
          a
        ) : (h._visibility |= 2, ti(
          t,
          e,
          n,
          a,
          (e.subtreeFlags & 10256) !== 0 || !1
        ))), c & 2048 && Sf(x, e);
        break;
      case 24:
        ln(
          t,
          e,
          n,
          a
        ), c & 2048 && xf(e.alternate, e);
        break;
      case 30:
        u && (c = e.alternate, c !== null && (An(c.child, !0), An(e.child, !0))), ln(
          t,
          e,
          n,
          a
        );
        break;
      default:
        ln(
          t,
          e,
          n,
          a
        );
    }
  }
  function ti(t, e, n, a, u) {
    for (u = u && ((e.subtreeFlags & 10256) !== 0 || !1), e = e.child; e !== null; ) {
      var c = t, h = e, x = n, z = a, q = h.flags;
      switch (h.tag) {
        case 0:
        case 11:
        case 15:
          ti(
            c,
            h,
            x,
            z,
            u
          ), gu(8, h);
          break;
        case 23:
          break;
        case 22:
          var $ = h.stateNode;
          h.memoizedState !== null ? $._visibility & 2 ? ti(
            c,
            h,
            x,
            z,
            u
          ) : vu(
            c,
            h
          ) : ($._visibility |= 2, ti(
            c,
            h,
            x,
            z,
            u
          )), u && q & 2048 && Sf(
            h.alternate,
            h
          );
          break;
        case 24:
          ti(
            c,
            h,
            x,
            z,
            u
          ), u && q & 2048 && xf(h.alternate, h);
          break;
        default:
          ti(
            c,
            h,
            x,
            z,
            u
          );
      }
      e = e.sibling;
    }
  }
  function vu(t, e) {
    if (e.subtreeFlags & 10256)
      for (e = e.child; e !== null; ) {
        var n = t, a = e, u = a.flags;
        switch (a.tag) {
          case 22:
            vu(n, a), u & 2048 && Sf(
              a.alternate,
              a
            );
            break;
          case 24:
            vu(n, a), u & 2048 && xf(a.alternate, a);
            break;
          default:
            vu(n, a);
        }
        e = e.sibling;
      }
  }
  var ra = 8192;
  function sa(t, e, n) {
    if (t.subtreeFlags & ra)
      for (t = t.child; t !== null; )
        em(
          t,
          e,
          n
        ), t = t.sibling;
  }
  function em(t, e, n) {
    switch (t.tag) {
      case 26:
        sa(
          t,
          e,
          n
        ), t.flags & ra && (t.memoizedState !== null ? mb(
          n,
          fn,
          t.memoizedState,
          t.memoizedProps
        ) : (t = t.stateNode, (e & 335544128) === e && cy(n, t)));
        break;
      case 5:
        sa(
          t,
          e,
          n
        ), t.flags & ra && (t = t.stateNode, (e & 335544128) === e && cy(n, t));
        break;
      case 3:
      case 4:
        var a = fn;
        fn = Nu(t.stateNode.containerInfo), sa(
          t,
          e,
          n
        ), fn = a;
        break;
      case 22:
        t.memoizedState === null && (a = t.alternate, a !== null && a.memoizedState !== null ? (a = ra, ra = 16777216, sa(
          t,
          e,
          n
        ), ra = a) : sa(
          t,
          e,
          n
        ));
        break;
      case 30:
        if ((t.flags & ra) !== 0 && (a = t.memoizedProps.name, a != null && a !== "auto")) {
          var u = t.stateNode;
          u.paired = null, je === null && (je = /* @__PURE__ */ new Map()), je.set(a, u);
        }
        sa(
          t,
          e,
          n
        );
        break;
      default:
        sa(
          t,
          e,
          n
        );
    }
  }
  function nm(t) {
    var e = t.alternate;
    if (e !== null && (t = e.child, t !== null)) {
      e.child = null;
      do
        e = t.sibling, t.sibling = null, t = e;
      while (t !== null);
    }
  }
  function pu(t) {
    var e = t.deletions;
    if ((t.flags & 16) !== 0) {
      if (e !== null)
        for (var n = 0; n < e.length; n++) {
          var a = e[n];
          de = a, am(
            a,
            t
          );
        }
      nm(t);
    }
    if (t.subtreeFlags & 10256)
      for (t = t.child; t !== null; )
        lm(t), t = t.sibling;
  }
  function lm(t) {
    switch (t.tag) {
      case 0:
      case 11:
      case 15:
        pu(t), t.flags & 2048 && _l(9, t, t.return);
        break;
      case 3:
        pu(t);
        break;
      case 12:
        pu(t);
        break;
      case 22:
        var e = t.stateNode;
        t.memoizedState !== null && e._visibility & 2 && (t.return === null || t.return.tag !== 13) ? (e._visibility &= -3, gc(t)) : pu(t);
        break;
      default:
        pu(t);
    }
  }
  function gc(t) {
    var e = t.deletions;
    if ((t.flags & 16) !== 0) {
      if (e !== null)
        for (var n = 0; n < e.length; n++) {
          var a = e[n];
          de = a, am(
            a,
            t
          );
        }
      nm(t);
    }
    for (t = t.child; t !== null; ) {
      switch (e = t, e.tag) {
        case 0:
        case 11:
        case 15:
          _l(8, e, e.return), gc(e);
          break;
        case 22:
          n = e.stateNode, n._visibility & 2 && (n._visibility &= -3, gc(e));
          break;
        default:
          gc(e);
      }
      t = t.sibling;
    }
  }
  function am(t, e) {
    for (; de !== null; ) {
      var n = de;
      switch (n.tag) {
        case 0:
        case 11:
        case 15:
          _l(8, n, e);
          break;
        case 23:
        case 22:
          if (n.memoizedState !== null && n.memoizedState.cachePool !== null) {
            var a = n.memoizedState.cachePool.pool;
            a != null && a.refCount++;
          }
          break;
        case 24:
          eu(n.memoizedState.cache);
      }
      if (a = n.child, a !== null) a.return = n, de = a;
      else
        t: for (n = t; de !== null; ) {
          a = de;
          var u = a.sibling, c = a.return;
          if ($g(a), a === n) {
            de = null;
            break t;
          }
          if (u !== null) {
            u.return = c, de = u;
            break t;
          }
          de = c;
        }
    }
  }
  var sx = {
    getCacheForType: function(t) {
      var e = ge(ne), n = e.data.get(t);
      return n === void 0 && (n = t(), e.data.set(t, n)), n;
    },
    cacheSignal: function() {
      return ge(ne).controller.signal;
    }
  }, fx = typeof WeakMap == "function" ? WeakMap : Map, Vt = 0, Gt = null, Ct = null, Dt = 0, qt = 0, Ze = null, Nl = !1, ei = !1, bf = !1, el = 0, Wt = 0, Tl = 0, fa = 0, mc = 0, Ge = 0, ni = 0, Su = null, Be = null, Ef = !1, yc = 0, im = 0, vc = 1 / 0, pc = null, Ml = null, It = 0, hn = null, da = null, Hn = 0, _f = 0, wf = null, um = null, li = null, ai = null, ii = null, xu = 0, Sc = null;
  function Qe() {
    return (Vt & 2) !== 0 && Dt !== 0 ? Dt & -Dt : ct.T !== null ? Hf() : so();
  }
  function om() {
    if (Ge === 0)
      if ((Dt & 536870912) === 0 || zt) {
        var t = Ma;
        Ma <<= 1, (Ma & 3932160) === 0 && (Ma = 262144), Ge = t;
      } else Ge = 536870912;
    return t = me.current, t !== null && (t.flags |= 32), Ge;
  }
  function ui(t, e) {
    if (e != null) {
      var n = t.stateNode, a = n.ref;
      a === null && (a = n.ref = Xm(
        Qn(t.memoizedProps, n)
      )), ai === null && (ai = []), ai.push(e.bind(null, a));
    }
  }
  function Ye(t, e, n) {
    (t === Gt && (qt === 2 || qt === 9) || t.cancelPendingCommit !== null) && (oi(t, 0), zl(
      t,
      Dt,
      Ge,
      !1
    )), Ql(t, n), ((Vt & 2) === 0 || t !== Gt) && (t === Gt && ((Vt & 2) === 0 && (fa |= n), Wt === 4 && zl(
      t,
      Dt,
      Ge,
      !1
    )), Un(t));
  }
  function cm(t, e, n) {
    if ((Vt & 6) !== 0) throw Error(r(327));
    var a = !n && (e & 127) === 0 && (e & t.expiredLanes) === 0 || Gl(t, e), u = a ? gx(t, e) : Tf(t, e, !0), c = a;
    do {
      if (u === 0) {
        ei && !a && zl(t, e, 0, !1);
        break;
      } else {
        if (n = t.current.alternate, c && !dx(n)) {
          u = Tf(t, e, !1), c = !1;
          continue;
        }
        if (u === 2) {
          if (c = e, t.errorRecoveryDisabledLanes & c)
            var h = 0;
          else
            h = t.pendingLanes & -536870913, h = h !== 0 ? h : h & 536870912 ? 536870912 : 0;
          if (h !== 0) {
            e = h;
            t: {
              var x = t;
              u = Su;
              var z = x.current.memoizedState.isDehydrated;
              if (z && (oi(x, h).flags |= 256), h = Tf(
                x,
                h,
                !1
              ), h !== 2 && h !== 6) {
                if (bf && !z) {
                  x.errorRecoveryDisabledLanes |= c, fa |= c, u = 4;
                  break t;
                }
                c = Be, Be = u, c !== null && (Be === null ? Be = c : Be.push.apply(
                  Be,
                  c
                ));
              }
              u = h;
            }
            if (c = !1, u !== 2) continue;
          }
        }
        if (u === 1) {
          oi(t, 0), zl(t, e, 0, !0);
          break;
        }
        t: {
          switch (a = t, c = u, c) {
            case 0:
            case 1:
              throw Error(r(345));
            case 4:
              if ((e & 4194048) !== e && (e & 62914560) !== e)
                break;
            case 6:
              zl(
                a,
                e,
                Ge,
                !Nl
              );
              break t;
            case 2:
              Be = null;
              break;
            case 3:
            case 5:
              break;
            default:
              throw Error(r(329));
          }
          if ((e & 62914560) === e && (u = yc + 300 - we(), 10 < u)) {
            if (zl(
              a,
              e,
              Ge,
              !Nl
            ), Ca(a, 0, !0) !== 0) break t;
            Hn = e, a.timeoutHandle = Qf(
              rm.bind(
                null,
                a,
                n,
                Be,
                pc,
                Ef,
                e,
                Ge,
                fa,
                ni,
                Nl,
                c,
                "Throttled",
                -0,
                0
              ),
              u
            );
            break t;
          }
          rm(
            a,
            n,
            Be,
            pc,
            Ef,
            e,
            Ge,
            fa,
            ni,
            Nl,
            c,
            null,
            -0,
            0
          );
        }
      }
      break;
    } while (!0);
    Un(t);
  }
  function rm(t, e, n, a, u, c, h, x, z, q, $, nt, Y, Q) {
    t.timeoutHandle = -1;
    var ht = e.subtreeFlags, yt = (c & 335544064) === c;
    if (nt = null, (yt || ht & 8192 || (ht & 16785408) === 16785408) && (nt = {
      stylesheets: null,
      count: 0,
      imgCount: 0,
      imgBytes: 0,
      suspenseyImages: [],
      waitingForImages: !0,
      waitingForViewTransition: !1,
      unsuspend: Nn
    }, je = null, em(
      e,
      c,
      nt
    ), yt && (ht = nt, yt = t.containerInfo, yt = (yt.nodeType === 9 ? yt : yt.ownerDocument).__reactViewTransition, yt != null && (ht.count++, ht.waitingForViewTransition = !0, ht = zu.bind(ht), yt.finished.then(ht, ht))), ht = (c & 62914560) === c ? yc - we() : (c & 4194048) === c ? im - we() : 0, ht = yb(
      nt,
      ht
    ), ht !== null)) {
      Hn = c, t.cancelPendingCommit = ht(
        vm.bind(
          null,
          t,
          e,
          c,
          n,
          a,
          u,
          h,
          x,
          z,
          q,
          $,
          nt,
          null,
          Y,
          Q
        )
      ), zl(t, c, h, !q);
      return;
    }
    vm(
      t,
      e,
      c,
      n,
      a,
      u,
      h,
      x,
      z,
      q,
      $,
      nt
    );
  }
  function dx(t) {
    for (var e = t; ; ) {
      var n = e.tag;
      if ((n === 0 || n === 11 || n === 15) && e.flags & 16384 && (n = e.updateQueue, n !== null && (n = n.stores, n !== null)))
        for (var a = 0; a < n.length; a++) {
          var u = n[a], c = u.getSnapshot;
          u = u.value;
          try {
            if (!qe(c(), u)) return !1;
          } catch {
            return !1;
          }
        }
      if (n = e.child, e.subtreeFlags & 16384 && n !== null)
        n.return = e, e = n;
      else {
        if (e === t) break;
        for (; e.sibling === null; ) {
          if (e.return === null || e.return === t) return !0;
          e = e.return;
        }
        e.sibling.return = e.return, e = e.sibling;
      }
    }
    return !0;
  }
  function zl(t, e, n, a) {
    e = Vi(t, e), e &= ~mc, e &= ~fa, t.suspendedLanes |= e, t.pingedLanes &= ~e, a && (t.warmLanes |= e), a = t.expirationTimes;
    for (var u = e; 0 < u; ) {
      var c = 31 - Te(u), h = 1 << c;
      a[c] = -1, u &= ~h;
    }
    n !== 0 && oo(t, n, e);
  }
  function xc() {
    return (Vt & 6) === 0 ? (bu(0), !1) : !0;
  }
  function Nf() {
    if (Ct !== null) {
      if (qt === 0)
        var t = Ct.return;
      else
        t = Ct, In = Pl = null, Ds(t), $a = null, au = 0, t = Ct;
      for (; t !== null; )
        Dg(t.alternate, t), t = t.return;
      Ct = null;
    }
  }
  function oi(t, e) {
    var n = t.timeoutHandle;
    return n !== -1 && (t.timeoutHandle = -1, Bx(n)), n = t.cancelPendingCommit, n !== null && (t.cancelPendingCommit = null, n()), Hn = 0, Nf(), Gt = t, Ct = n = $n(t.current, null), Dt = e, qt = 0, Ze = null, Nl = !1, ei = Gl(t, e), bf = !1, ni = Ge = mc = fa = Tl = Wt = 0, Be = Su = null, Ef = !1, el = Vi(t, e), zo(), n;
  }
  function sm(t, e) {
    Nt = null, ct.H = Po, e === Ka || e === Lo ? (e = v0(), qt = 3) : e === Ss ? (e = v0(), qt = 4) : qt = e === $s ? 8 : e !== null && typeof e == "object" && typeof e.then == "function" ? 6 : 1, Ze = e, Ct === null && (Wt = 1, tc(
      t,
      Pe(e, t.current)
    ));
  }
  function fm() {
    var t = me.current;
    return t === null ? !0 : (Dt & 4194048) === Dt ? Ee === null : (Dt & 62914560) === Dt || (Dt & 536870912) !== 0 ? t === Ee : !1;
  }
  function dm() {
    var t = ct.H;
    return ct.H = Po, t === null ? Po : t;
  }
  function hm() {
    var t = ct.A;
    return ct.A = sx, t;
  }
  function bc() {
    Wt = 4, Nl || (Dt & 4194048) !== Dt && me.current !== null || (ei = !0), (Tl & 134217727) === 0 && (fa & 134217727) === 0 || Gt === null || zl(
      Gt,
      Dt,
      Ge,
      !1
    );
  }
  function Tf(t, e, n) {
    var a = Vt;
    Vt |= 2;
    var u = dm(), c = hm();
    (Gt !== t || Dt !== e) && (pc = null, oi(t, e)), e = !1;
    var h = Wt;
    t: do
      try {
        if (qt !== 0 && Ct !== null) {
          var x = Ct, z = Ze;
          switch (qt) {
            case 8:
              Nf(), h = 6;
              break t;
            case 3:
            case 2:
            case 9:
            case 6:
              me.current === null && (e = !0);
              var q = qt;
              if (qt = 0, Ze = null, ci(t, x, z, q), n && ei) {
                h = 0;
                break t;
              }
              break;
            default:
              q = qt, qt = 0, Ze = null, ci(t, x, z, q);
          }
        }
        hx(), h = Wt;
        break;
      } catch ($) {
        sm(t, $);
      }
    while (!0);
    return e && t.shellSuspendCounter++, In = Pl = null, Vt = a, ct.H = u, ct.A = c, Ct === null && (Gt = null, Dt = 0, zo()), h;
  }
  function hx() {
    for (; Ct !== null; ) gm(Ct);
  }
  function gx(t, e) {
    var n = Vt;
    Vt |= 2;
    var a = dm(), u = hm();
    Gt !== t || Dt !== e ? (pc = null, vc = we() + 500, oi(t, e)) : ei = Gl(
      t,
      e
    );
    t: do
      try {
        if (qt !== 0 && Ct !== null) {
          e = Ct;
          var c = Ze;
          e: switch (qt) {
            case 1:
              qt = 0, Ze = null, ci(t, e, c, 1);
              break;
            case 2:
            case 9:
              if (m0(c)) {
                qt = 0, Ze = null, mm(e);
                break;
              }
              e = function() {
                qt !== 2 && qt !== 9 || Gt !== t || (qt = 7), Un(t);
              }, c.then(e, e);
              break t;
            case 3:
              qt = 7;
              break t;
            case 4:
              qt = 5;
              break t;
            case 7:
              m0(c) ? (qt = 0, Ze = null, mm(e)) : (qt = 0, Ze = null, ci(t, e, c, 7));
              break;
            case 5:
              var h = null;
              switch (Ct.tag) {
                case 26:
                  h = Ct.memoizedState;
                case 5:
                case 27:
                  var x = Ct;
                  if (h ? uy(h) : x.stateNode.complete) {
                    qt = 0, Ze = null;
                    var z = x.sibling;
                    if (z !== null) Ct = z;
                    else {
                      var q = x.return;
                      q !== null ? (Ct = q, Ec(q)) : Ct = null;
                    }
                    break e;
                  }
              }
              qt = 0, Ze = null, ci(t, e, c, 5);
              break;
            case 6:
              qt = 0, Ze = null, ci(t, e, c, 6);
              break;
            case 8:
              Nf(), Wt = 6;
              break t;
            default:
              throw Error(r(462));
          }
        }
        mx();
        break;
      } catch ($) {
        sm(t, $);
      }
    while (!0);
    return In = Pl = null, ct.H = a, ct.A = u, Vt = n, Ct !== null ? 0 : (Gt = null, Dt = 0, zo(), Wt);
  }
  function mx() {
    for (; Ct !== null && !Tr(); )
      gm(Ct);
  }
  function gm(t) {
    var e = Ag(t.alternate, t, el);
    t.memoizedProps = t.pendingProps, e === null ? Ec(t) : Ct = e;
  }
  function mm(t) {
    var e = t, n = e.alternate;
    switch (e.tag) {
      case 15:
      case 0:
        e = _g(
          n,
          e,
          e.pendingProps,
          e.type,
          void 0,
          Dt
        );
        break;
      case 11:
        e = _g(
          n,
          e,
          e.pendingProps,
          e.type.render,
          e.ref,
          Dt
        );
        break;
      case 5:
        Ds(e);
        var a = e;
        a === se && (zt ? (Ho(a), a.tag === 5 && a.stateNode != null && (Qt = a.stateNode)) : (Ho(a), zt = !0));
      default:
        Dg(n, e), e = Ct = a0(e, el), e = Ag(n, e, el);
    }
    t.memoizedProps = t.pendingProps, e === null ? Ec(t) : Ct = e;
  }
  function ci(t, e, n, a) {
    In = Pl = null, Ds(e), $a = null, au = 0;
    var u = e.return;
    try {
      if (nx(
        t,
        u,
        e,
        n,
        Dt
      )) {
        Wt = 1, tc(
          t,
          Pe(n, t.current)
        ), Ct = null;
        return;
      }
    } catch (c) {
      if (u !== null) throw Ct = u, c;
      Wt = 1, tc(
        t,
        Pe(n, t.current)
      ), Ct = null;
      return;
    }
    e.flags & 32768 ? (zt || a === 1 ? t = !0 : ei || (Dt & 536870912) !== 0 ? t = !1 : (Nl = t = !0, (a === 2 || a === 9 || a === 3 || a === 6) && (a = me.current, a !== null && a.tag === 13 && (a.flags |= 16384))), ym(e, t)) : Ec(e);
  }
  function Ec(t) {
    var e = t;
    do {
      if ((e.flags & 32768) !== 0) {
        ym(
          e,
          Nl
        );
        return;
      }
      t = e.return;
      var n = ux(
        e.alternate,
        e,
        el
      );
      if (n !== null) {
        Ct = n;
        return;
      }
      if (e = e.sibling, e !== null) {
        Ct = e;
        return;
      }
      Ct = e = t;
    } while (e !== null);
    Wt === 0 && (Wt = 5);
  }
  function ym(t, e) {
    do {
      var n = ox(t.alternate, t);
      if (n !== null) {
        n.flags &= 32767, Ct = n;
        return;
      }
      if (n = t.return, n !== null && (n.flags |= 32768, n.subtreeFlags = 0, n.deletions = null), !e && (t = t.sibling, t !== null)) {
        Ct = t;
        return;
      }
      Ct = t = n;
    } while (t !== null);
    Wt = 6, Ct = null;
  }
  function vm(t, e, n, a, u, c, h, x, z, q, $, nt) {
    t.cancelPendingCommit = null;
    do
      _c();
    while (It !== 0);
    if ((Vt & 6) !== 0) throw Error(r(327));
    if (e !== null) {
      if (e === t.current) throw Error(r(177));
      t === Gt && (Ct = Gt = null, Dt = 0), da = e, hn = t, Hn = n, wf = u, um = a, yx(
        t,
        e,
        n,
        h,
        x,
        z,
        nt
      );
    }
  }
  function yx(t, e, n, a, u, c, h) {
    var x = e.lanes | e.childLanes;
    if (_f = x, x |= us, Ur(
      t,
      n,
      x,
      a,
      u,
      c
    ), ai = null, (n & 335544064) === n ? (ii = GS(t), a = 10262) : (ii = null, a = 10256), (e.subtreeFlags & a) !== 0 || (e.flags & a) !== 0 ? (t.callbackNode = null, t.callbackPriority = 0, Ex(Na, function() {
      return Af(), null;
    })) : (t.callbackNode = null, t.callbackPriority = 0), cc = !1, a = (e.flags & 13878) !== 0, (e.subtreeFlags & 13878) !== 0 || a) {
      a = ct.T, ct.T = null, u = rt.p, rt.p = 2, c = Vt, Vt |= 4;
      try {
        cx(t, e, n);
      } finally {
        Vt = c, rt.p = u, ct.T = a;
      }
    }
    It = 1, cc ? li = jx(
      h,
      t.containerInfo,
      ii,
      Mf,
      zf,
      px,
      Cf,
      Af,
      vx
    ) : (Mf(), zf(), Cf());
  }
  function vx(t) {
    if (It !== 0) {
      var e = hn.onRecoverableError;
      e(t, { componentStack: null });
    }
  }
  function px() {
    It === 3 && (It = 0, Pg(da, hn), It = 4);
  }
  function Mf() {
    if (It === 1) {
      It = 0;
      var t = hn, e = da, n = Hn, a = (e.flags & 13878) !== 0;
      if ((e.subtreeFlags & 13878) !== 0 || a) {
        a = ct.T, ct.T = null;
        var u = rt.p;
        rt.p = 2;
        var c = Vt;
        Vt |= 4;
        try {
          yu = fc = !1, Fg(e, t, n), n = jf;
          var h = Jh(t.containerInfo), x = n.focusedElem, z = n.selectionRange;
          if (h !== x && x && x.ownerDocument && $h(
            x.ownerDocument.documentElement,
            x
          )) {
            if (z !== null && es(x)) {
              var q = z.start, $ = z.end;
              if ($ === void 0 && ($ = q), "selectionStart" in x)
                x.selectionStart = q, x.selectionEnd = Math.min(
                  $,
                  x.value.length
                );
              else {
                var nt = x.ownerDocument || document, Y = nt && nt.defaultView || window;
                if (Y.getSelection) {
                  var Q = Y.getSelection(), ht = x.textContent.length, yt = Math.min(z.start, ht), Tt = z.end === void 0 ? yt : Math.min(z.end, ht);
                  !Q.extend && yt > Tt && (h = Tt, Tt = yt, yt = h);
                  var L = Kh(
                    x,
                    yt
                  ), D = Kh(
                    x,
                    Tt
                  );
                  if (L && D && (Q.rangeCount !== 1 || Q.anchorNode !== L.node || Q.anchorOffset !== L.offset || Q.focusNode !== D.node || Q.focusOffset !== D.offset)) {
                    var G = nt.createRange();
                    G.setStart(L.node, L.offset), Q.removeAllRanges(), yt > Tt ? (Q.addRange(G), Q.extend(D.node, D.offset)) : (G.setEnd(D.node, D.offset), Q.addRange(G));
                  }
                }
              }
            }
            for (nt = [], Q = x; Q = Q.parentNode; )
              Q.nodeType === 1 && nt.push({
                element: Q,
                left: Q.scrollLeft,
                top: Q.scrollTop
              });
            for (typeof x.focus == "function" && x.focus(), x = 0; x < nt.length; x++) {
              var et = nt[x];
              et.element.scrollLeft = et.left, et.element.scrollTop = et.top;
            }
          }
          yi = !!Xf, jf = Xf = null;
        } finally {
          Vt = c, rt.p = u, ct.T = a;
        }
      }
      t.current = e, It = 2;
    }
  }
  function zf() {
    if (It === 2) {
      It = 0;
      var t = hn, e = da, n = (e.flags & 8772) !== 0;
      if ((e.subtreeFlags & 8772) !== 0 || n) {
        n = ct.T, ct.T = null;
        var a = rt.p;
        rt.p = 2;
        var u = Vt;
        Vt |= 4;
        try {
          Qg(t, e.alternate, e);
        } finally {
          Vt = u, rt.p = a, ct.T = n;
        }
      }
      It = 3;
    }
  }
  function Cf() {
    if (It === 4 || It === 3) {
      It = 0;
      var t = li;
      li = null, Mr();
      var e = hn, n = da, a = Hn, u = um, c = (a & 335544064) === a ? 10262 : 10256;
      if ((n.subtreeFlags & c) !== 0 || (n.flags & c) !== 0 ? It = 5 : (It = 0, da = hn = null, pm(e, e.pendingLanes)), c = e.pendingLanes, c === 0 && (Ml = null), Xi(a), n = n.stateNode, Ne && typeof Ne.onCommitFiberRoot == "function")
        try {
          Ne.onCommitFiberRoot(
            Zl,
            n,
            void 0,
            (n.current.flags & 128) === 128
          );
        } catch {
        }
      if (u !== null) {
        n = ct.T, c = rt.p, rt.p = 2, ct.T = null;
        try {
          for (var h = e.onRecoverableError, x = 0; x < u.length; x++) {
            var z = u[x];
            h(z.value, {
              componentStack: z.stack
            });
          }
        } finally {
          ct.T = n, rt.p = c;
        }
      }
      if (u = ai, h = ii, ii = null, u !== null && (ai = null, h === null && (h = []), t !== null))
        for (z = 0; z < u.length; z++)
          n = (0, u[z])(
            h
          ), n !== void 0 && t.finished.finally(n);
      (Hn & 3) !== 0 && _c(), Un(e), c = e.pendingLanes, (a & 261930) !== 0 && (c & 42) !== 0 ? e === Sc ? xu++ : (xu = 0, Sc = e) : (xu = 0, Sc = null), bu(0);
    }
  }
  function pm(t, e) {
    (t.pooledCacheLanes &= e) === 0 && (e = t.pooledCache, e != null && (t.pooledCache = null, eu(e)));
  }
  function _c() {
    return li !== null && (li.skipTransition(), li = null), Mf(), zf(), Cf(), Af();
  }
  function Af() {
    if (It !== 5) return !1;
    var t = hn, e = _f;
    _f = 0;
    var n = Xi(Hn), a = ct.T, u = rt.p;
    try {
      rt.p = 32 > n ? 32 : n, ct.T = null, n = wf, wf = null;
      var c = hn, h = Hn;
      if (It = 0, da = hn = null, Hn = 0, (Vt & 6) !== 0) throw Error(r(331));
      var x = Vt;
      if (Vt |= 4, lm(c.current), tm(
        c,
        c.current,
        h,
        n
      ), Vt = x, bu(0, !1), Ne && typeof Ne.onPostCommitFiberRoot == "function")
        try {
          Ne.onPostCommitFiberRoot(Zl, c);
        } catch {
        }
      return !0;
    } finally {
      rt.p = u, ct.T = a, pm(t, e);
    }
  }
  function Sm(t, e, n) {
    e = Pe(n, e), e = Ks(t.stateNode, e, 2), t = Sl(t, e, 2), t !== null && (Ql(t, 2), Un(t));
  }
  function Xt(t, e, n) {
    if (t.tag === 3)
      Sm(t, t, n);
    else
      for (; e !== null; ) {
        if (e.tag === 3) {
          Sm(
            e,
            t,
            n
          );
          break;
        } else if (e.tag === 1) {
          var a = e.stateNode;
          if (typeof e.type.getDerivedStateFromError == "function" || typeof a.componentDidCatch == "function" && (Ml === null || !Ml.has(a))) {
            t = Pe(n, t), n = mg(2), a = Sl(e, n, 2), a !== null && (yg(
              n,
              a,
              e,
              t
            ), Ql(a, 2), Un(a));
            break;
          }
        }
        e = e.return;
      }
  }
  function Of(t, e, n) {
    var a = t.pingCache;
    if (a === null) {
      a = t.pingCache = new fx();
      var u = /* @__PURE__ */ new Set();
      a.set(e, u);
    } else
      u = a.get(e), u === void 0 && (u = /* @__PURE__ */ new Set(), a.set(e, u));
    u.has(n) || (bf = !0, u.add(n), t = Sx.bind(null, t, e, n), e.then(t, t));
  }
  function Sx(t, e, n) {
    var a = t.pingCache;
    a !== null && a.delete(e), t.pingedLanes |= t.suspendedLanes & n, t.warmLanes &= ~n, Gt === t && (Dt & n) === n && ((Wt === 4 || Wt === 3 && (Dt & 62914560) === Dt && 300 > we() - yc) && (Vt & 2) === 0 ? oi(t, 0) : mc |= n, ni === Dt && (ni = 0)), Un(t);
  }
  function xm(t, e) {
    e === 0 && (e = Li()), t = kl(t, e), t !== null && (Ql(t, e), Un(t));
  }
  function xx(t) {
    var e = t.memoizedState, n = 0;
    e !== null && (n = e.retryLane), xm(t, n);
  }
  function bx(t, e) {
    var n = 0;
    switch (t.tag) {
      case 31:
      case 13:
        var a = t.stateNode, u = t.memoizedState;
        u !== null && (n = u.retryLane);
        break;
      case 19:
        a = t.stateNode;
        break;
      case 22:
        a = t.stateNode._retryCache;
        break;
      default:
        throw Error(r(314));
    }
    a !== null && a.delete(e), xm(t, n);
  }
  function Ex(t, e) {
    return Bi(t, e);
  }
  var ri = null, si = null, Df = !1, wc = !1, Rf = !1, Cl = 0;
  function Un(t) {
    t !== si && t.next === null && (si === null ? ri = si = t : si = si.next = t), wc = !0, Df || (Df = !0, wx());
  }
  function bu(t, e) {
    if (!Rf && wc) {
      Rf = !0;
      do
        for (var n = !1, a = ri; a !== null; ) {
          if (t !== 0) {
            var u = a.pendingLanes;
            if (u === 0) var c = 0;
            else {
              var h = a.suspendedLanes, x = a.pingedLanes;
              c = (1 << 31 - Te(42 | t) + 1) - 1, c &= u & ~(h & ~x), c = c & 201326741 ? c & 201326741 | 1 : c ? c | 2 : 0;
            }
            c !== 0 && (n = !0, wm(a, c));
          } else
            c = Dt, c = Ca(
              a,
              a === Gt ? c : 0,
              a.cancelPendingCommit !== null || a.timeoutHandle !== -1
            ), (c & 3) === 0 || Gl(a, c) || (n = !0, wm(a, c));
          a = a.next;
        }
      while (n);
      Rf = !1;
    }
  }
  function _x() {
    bm();
  }
  function bm() {
    wc = Df = !1;
    var t = 0;
    Cl !== 0 && Ux() && (t = Cl);
    for (var e = we(), n = null, a = ri; a !== null; ) {
      var u = a.next, c = Em(a, e);
      c === 0 ? (a.next = null, n === null ? ri = u : n.next = u, u === null && (si = n)) : (n = a, (t !== 0 || (c & 3) !== 0) && (wc = !0)), a = u;
    }
    It !== 0 && It !== 5 || bu(t), Cl !== 0 && (Cl = 0);
  }
  function Em(t, e) {
    for (var n = t.suspendedLanes, a = t.pingedLanes, u = t.expirationTimes, c = t.pendingLanes & -62914561; 0 < c; ) {
      var h = 31 - Te(c), x = 1 << h, z = u[h];
      z === -1 ? ((x & n) === 0 || (x & a) !== 0) && (u[h] = uo(x, e)) : z <= e && (t.expiredLanes |= x), c &= ~x;
    }
    if (e = Gt, n = Dt, n = Ca(
      t,
      t === e ? n : 0,
      t.cancelPendingCommit !== null || t.timeoutHandle !== -1
    ), a = t.callbackNode, n === 0 || t === e && (qt === 2 || qt === 9) || t.cancelPendingCommit !== null)
      return a !== null && a !== null && Yi(a), t.callbackNode = null, t.callbackPriority = 0;
    if ((n & 3) === 0 || Gl(t, n)) {
      if (e = n & -n, e === t.callbackPriority) return e;
      switch (a !== null && Yi(a), Xi(n)) {
        case 2:
        case 8:
          n = ao;
          break;
        case 32:
          n = Na;
          break;
        case 268435456:
          n = io;
          break;
        default:
          n = Na;
      }
      return a = _m.bind(null, t), n = Bi(n, a), t.callbackPriority = e, t.callbackNode = n, e;
    }
    return a !== null && a !== null && Yi(a), t.callbackPriority = 2, t.callbackNode = null, 2;
  }
  function _m(t, e) {
    if (It !== 0 && It !== 5)
      return t.callbackNode = null, t.callbackPriority = 0, null;
    var n = t.callbackNode;
    if (_c() && t.callbackNode !== n)
      return null;
    var a = Dt;
    return a = Ca(
      t,
      t === Gt ? a : 0,
      t.cancelPendingCommit !== null || t.timeoutHandle !== -1
    ), a === 0 ? null : (cm(t, a, e), Em(t, we()), t.callbackNode != null && t.callbackNode === n ? _m.bind(null, t) : null);
  }
  function wm(t, e) {
    if (_c()) return null;
    cm(t, e, !0);
  }
  function wx() {
    Yx(function() {
      (Vt & 6) !== 0 ? Bi(
        lo,
        _x
      ) : bm();
    });
  }
  function Hf() {
    if (Cl === 0) {
      var t = na;
      t === 0 && (t = Ta, Ta <<= 1, (Ta & 261888) === 0 && (Ta = 256)), Cl = t;
    }
    return Cl;
  }
  function Nm(t) {
    return t == null || typeof t == "symbol" || typeof t == "boolean" ? null : typeof t == "function" ? t : xo(t);
  }
  function Nx(t, e, n, a, u) {
    if (e === "submit" && n && n.stateNode === u) {
      var c = Nm(
        (u[be] || null).action
      ), h = a.submitter;
      h && (e = (e = h[be] || null) ? Nm(e.formAction) : h.getAttribute("formAction"), e !== null && (c = e, h = null));
      var x = new wo(
        "action",
        "action",
        null,
        a,
        u
      );
      t.push({
        event: x,
        listeners: [
          {
            instance: null,
            listener: function() {
              if (a.defaultPrevented) {
                if (Cl !== 0) {
                  var z = new FormData(u, h);
                  Xs(
                    n,
                    {
                      pending: !0,
                      data: z,
                      method: u.method,
                      action: c
                    },
                    null,
                    z
                  );
                }
              } else
                typeof c == "function" && (x.preventDefault(), z = new FormData(u, h), Xs(
                  n,
                  {
                    pending: !0,
                    data: z,
                    method: u.method,
                    action: c
                  },
                  c,
                  z
                ));
            },
            currentTarget: u
          }
        ]
      });
    }
  }
  for (var Uf = 0; Uf < is.length; Uf++) {
    var Bf = is[Uf], Tx = Bf.toLowerCase(), Mx = Bf[0].toUpperCase() + Bf.slice(1);
    rn(
      Tx,
      "on" + Mx
    );
  }
  rn(Fh, "onAnimationEnd"), rn(Wh, "onAnimationIteration"), rn(Ph, "onAnimationStart"), rn("dblclick", "onDoubleClick"), rn("focusin", "onFocus"), rn("focusout", "onBlur"), rn(BS, "onTransitionRun"), rn(YS, "onTransitionStart"), rn(VS, "onTransitionCancel"), rn(t0, "onTransitionEnd"), rl("onMouseEnter", ["mouseout", "mouseover"]), rl("onMouseLeave", ["mouseout", "mouseover"]), rl("onPointerEnter", ["pointerout", "pointerover"]), rl("onPointerLeave", ["pointerout", "pointerover"]), cn(
    "onChange",
    "change click focusin focusout input keydown keyup selectionchange".split(" ")
  ), cn(
    "onSelect",
    "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(
      " "
    )
  ), cn("onBeforeInput", [
    "compositionend",
    "keypress",
    "textInput",
    "paste"
  ]), cn(
    "onCompositionEnd",
    "compositionend focusout keydown keypress keyup mousedown".split(" ")
  ), cn(
    "onCompositionStart",
    "compositionstart focusout keydown keypress keyup mousedown".split(" ")
  ), cn(
    "onCompositionUpdate",
    "compositionupdate focusout keydown keypress keyup mousedown".split(" ")
  );
  var Eu = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(
    " "
  ), zx = new Set(
    "beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(Eu)
  );
  function Tm(t, e) {
    e = (e & 4) !== 0;
    for (var n = 0; n < t.length; n++) {
      var a = t[n], u = a.event;
      a = a.listeners;
      t: {
        var c = void 0;
        if (e)
          for (var h = a.length - 1; 0 <= h; h--) {
            var x = a[h], z = x.instance, q = x.currentTarget;
            if (x = x.listener, z !== c && u.isPropagationStopped())
              break t;
            c = x, u.currentTarget = q;
            try {
              c(u);
            } catch ($) {
              Mo($);
            }
            u.currentTarget = null, c = z;
          }
        else
          for (h = 0; h < a.length; h++) {
            if (x = a[h], z = x.instance, q = x.currentTarget, x = x.listener, z !== c && u.isPropagationStopped())
              break t;
            c = x, u.currentTarget = q;
            try {
              c(u);
            } catch ($) {
              Mo($);
            }
            u.currentTarget = null, c = z;
          }
      }
    }
  }
  function At(t, e) {
    var n = e[ho];
    n === void 0 && (n = e[ho] = /* @__PURE__ */ new Set());
    var a = t + "__bubble";
    n.has(a) || (Mm(e, t, 2, !1), n.add(a));
  }
  function Yf(t, e, n) {
    var a = 0;
    e && (a |= 4), Mm(
      n,
      t,
      a,
      e
    );
  }
  var Nc = "_reactListening" + Math.random().toString(36).slice(2);
  function Vf(t) {
    if (!t[Nc]) {
      t[Nc] = !0, yo.forEach(function(n) {
        n !== "selectionchange" && (zx.has(n) || Yf(n, !1, t), Yf(n, !0, t));
      });
      var e = t.nodeType === 9 ? t : t.ownerDocument;
      e === null || e[Nc] || (e[Nc] = !0, Yf("selectionchange", !1, e));
    }
  }
  function Mm(t, e, n, a) {
    switch (yy(e)) {
      case 2:
        var u = xb;
        break;
      case 8:
        u = bb;
        break;
      default:
        u = ad;
    }
    n = u.bind(
      null,
      e,
      n,
      t
    ), u = void 0, !Qr || e !== "touchstart" && e !== "touchmove" && e !== "wheel" || (u = !0), a ? u !== void 0 ? t.addEventListener(e, n, {
      capture: !0,
      passive: u
    }) : t.addEventListener(e, n, !0) : u !== void 0 ? t.addEventListener(e, n, {
      passive: u
    }) : t.addEventListener(e, n, !1);
  }
  function Lf(t, e, n, a, u) {
    var c = a;
    if ((e & 1) === 0 && (e & 2) === 0 && a !== null)
      t: for (; ; ) {
        if (a === null) return;
        var h = a.tag;
        if (h === 3 || h === 4) {
          var x = a.stateNode.containerInfo;
          if (x === u) break;
          if (h === 4)
            for (h = a.return; h !== null; ) {
              var z = h.tag;
              if ((z === 3 || z === 4) && h.stateNode.containerInfo === u)
                return;
              h = h.return;
            }
          for (; x !== null; ) {
            if (h = Xn(x), h === null) return;
            if (z = h.tag, z === 5 || z === 6 || z === 26 || z === 27) {
              a = c = h;
              continue t;
            }
            x = x.parentNode;
          }
        }
        a = a.return;
      }
    Mh(function() {
      var q = c, $ = Zr(n), nt = [];
      t: {
        var Y = e0.get(t);
        if (Y !== void 0) {
          var Q = wo, ht = t;
          switch (t) {
            case "keypress":
              if (Eo(n) === 0) break t;
            case "keydown":
            case "keyup":
              Q = dS;
              break;
            case "focusin":
              ht = "focus", Q = Ir;
              break;
            case "focusout":
              ht = "blur", Q = Ir;
              break;
            case "beforeblur":
            case "afterblur":
              Q = Ir;
              break;
            case "click":
              if (n.button === 2) break t;
            case "auxclick":
            case "dblclick":
            case "mousedown":
            case "mousemove":
            case "mouseup":
            case "mouseout":
            case "mouseover":
            case "contextmenu":
              Q = Ah;
              break;
            case "drag":
            case "dragend":
            case "dragenter":
            case "dragexit":
            case "dragleave":
            case "dragover":
            case "dragstart":
            case "drop":
              Q = tS;
              break;
            case "touchcancel":
            case "touchend":
            case "touchmove":
            case "touchstart":
              Q = vS;
              break;
            case Fh:
            case Wh:
            case Ph:
              Q = lS;
              break;
            case t0:
              Q = SS;
              break;
            case "scroll":
            case "scrollend":
              Q = W1;
              break;
            case "wheel":
              Q = bS;
              break;
            case "copy":
            case "cut":
            case "paste":
              Q = iS;
              break;
            case "gotpointercapture":
            case "lostpointercapture":
            case "pointercancel":
            case "pointerdown":
            case "pointermove":
            case "pointerout":
            case "pointerover":
            case "pointerup":
              Q = Dh;
              break;
            case "submit":
              Q = mS;
              break;
            case "toggle":
            case "beforetoggle":
              Q = _S;
          }
          var yt = (e & 4) !== 0, Tt = !yt && (t === "scroll" || t === "scrollend"), L = yt ? Y !== null ? Y + "Capture" : null : Y;
          yt = [];
          for (var D = q, G; D !== null; ) {
            var et = D;
            if (G = et.stateNode, et = et.tag, et !== 5 && et !== 26 && et !== 27 || G === null || L === null || (et = Gi(D, L), et != null && yt.push(
              _u(D, et, G)
            )), Tt) break;
            D = D.return;
          }
          0 < yt.length && (Y = new Q(
            Y,
            ht,
            null,
            n,
            $
          ), nt.push({ event: Y, listeners: yt }));
        }
      }
      if ((e & 7) === 0) {
        t: {
          if (Q = t === "mouseover" || t === "pointerover", Y = t === "mouseout" || t === "pointerout", Q && n !== jr && (ht = n.relatedTarget || n.fromElement) && (Xn(ht) || ht[ol]))
            break t;
          (Y || Q) && (ht = $.window === $ ? $ : (Q = $.ownerDocument) ? Q.defaultView || Q.parentWindow : window, Y ? (Q = n.relatedTarget || n.toElement, Y = q, Q = Q ? Xn(Q) : null, Q !== null && (Tt = f(Q), yt = Q.tag, Q !== Tt || yt !== 5 && yt !== 27 && yt !== 6) && (Q = null)) : (Y = null, Q = q), Y !== Q && (yt = Ah, et = "onMouseLeave", L = "onMouseEnter", D = "mouse", (t === "pointerout" || t === "pointerover") && (yt = Dh, et = "onPointerLeave", L = "onPointerEnter", D = "pointer"), Tt = Y == null ? ht : $l(Y), G = Q == null ? ht : $l(Q), ht = new yt(
            et,
            D + "leave",
            Y,
            n,
            $
          ), ht.target = Tt, ht.relatedTarget = G, et = null, Xn($) === q && (yt = new yt(
            L,
            D + "enter",
            Q,
            n,
            $
          ), yt.target = G, yt.relatedTarget = Tt, et = yt), Tt = et, yt = Y && Q ? B(
            Y,
            Q,
            Cx
          ) : null, Y !== null && zm(
            nt,
            ht,
            Y,
            yt,
            !1
          ), Q !== null && Tt !== null && zm(
            nt,
            Tt,
            Q,
            yt,
            !0
          )));
        }
        t: {
          if (Y = q ? $l(q) : window, Q = Y.nodeName && Y.nodeName.toLowerCase(), Q === "select" || Q === "input" && Y.type === "file")
            var mt = qh;
          else if (Vh(Y))
            if (Xh)
              mt = RS;
            else {
              mt = OS;
              var Rt = AS;
            }
          else
            Q = Y.nodeName, !Q || Q.toLowerCase() !== "input" || Y.type !== "checkbox" && Y.type !== "radio" ? q && Xr(q.elementType) && (mt = qh) : mt = DS;
          if (mt && (mt = mt(t, q))) {
            Lh(
              nt,
              mt,
              n,
              $
            );
            break t;
          }
          Rt && Rt(t, Y, q);
        }
        switch (Rt = q ? $l(q) : window, t) {
          case "focusin":
            (Vh(Rt) || Rt.contentEditable === "true") && (Va = Rt, ns = q, Wi = null);
            break;
          case "focusout":
            Wi = ns = Va = null;
            break;
          case "mousedown":
            ls = !0;
            break;
          case "contextmenu":
          case "mouseup":
          case "dragend":
            ls = !1, Ih(nt, n, $);
            break;
          case "selectionchange":
            if (US) break;
          case "keydown":
          case "keyup":
            Ih(nt, n, $);
        }
        var St;
        if (Fr)
          t: {
            switch (t) {
              case "compositionstart":
                var bt = "onCompositionStart";
                break t;
              case "compositionend":
                bt = "onCompositionEnd";
                break t;
              case "compositionupdate":
                bt = "onCompositionUpdate";
                break t;
            }
            bt = void 0;
          }
        else
          Ya ? Bh(t, n) && (bt = "onCompositionEnd") : t === "keydown" && n.keyCode === 229 && (bt = "onCompositionStart");
        bt && (Rh && n.locale !== "ko" && (Ya || bt !== "onCompositionStart" ? bt === "onCompositionEnd" && Ya && (St = zh()) : (sl = $, Kr = "value" in sl ? sl.value : sl.textContent, Ya = !0)), Rt = Tc(q, bt), 0 < Rt.length && (bt = new Oh(
          bt,
          t,
          null,
          n,
          $
        ), nt.push({ event: bt, listeners: Rt }), St ? bt.data = St : (St = Yh(n), St !== null && (bt.data = St)))), (St = NS ? TS(t, n) : MS(t, n)) && (bt = Tc(q, "onBeforeInput"), 0 < bt.length && (Rt = new Oh(
          "onBeforeInput",
          "beforeinput",
          null,
          n,
          $
        ), nt.push({
          event: Rt,
          listeners: bt
        }), Rt.data = St)), Nx(
          nt,
          t,
          q,
          n,
          $
        );
      }
      Tm(nt, e);
    });
  }
  function _u(t, e, n) {
    return {
      instance: t,
      listener: e,
      currentTarget: n
    };
  }
  function Tc(t, e) {
    for (var n = e + "Capture", a = []; t !== null; ) {
      var u = t, c = u.stateNode;
      if (u = u.tag, u !== 5 && u !== 26 && u !== 27 || c === null || (u = Gi(t, n), u != null && a.unshift(
        _u(t, u, c)
      ), u = Gi(t, e), u != null && a.push(
        _u(t, u, c)
      )), t.tag === 3) return a;
      t = t.return;
    }
    return [];
  }
  function Cx(t) {
    if (t === null) return null;
    do
      t = t.return;
    while (t && t.tag !== 5 && t.tag !== 27);
    return t || null;
  }
  function zm(t, e, n, a, u) {
    for (var c = e._reactName, h = []; n !== null && n !== a; ) {
      var x = n, z = x.alternate, q = x.stateNode;
      if (x = x.tag, z !== null && z === a) break;
      x !== 5 && x !== 26 && x !== 27 || q === null || (z = q, u ? (q = Gi(n, c), q != null && h.unshift(
        _u(n, q, z)
      )) : u || (q = Gi(n, c), q != null && h.push(
        _u(n, q, z)
      ))), n = n.return;
    }
    h.length !== 0 && t.push({ event: e, listeners: h });
  }
  var Ax = /\r\n?/g, Ox = /\u0000|\uFFFD/g;
  function Cm(t) {
    return (typeof t == "string" ? t : "" + t).replace(Ax, `
`).replace(Ox, "");
  }
  function Am(t, e) {
    return e = Cm(e), Cm(t) === e;
  }
  function jt(t, e, n, a, u, c) {
    switch (n) {
      case "children":
        if (typeof a == "string")
          e === "body" || e === "textarea" && a === "" || Ha(t, a);
        else if (typeof a == "number" || typeof a == "bigint")
          e !== "body" && Ha(t, "" + a);
        else return;
        break;
      case "className":
        So(t, "class", a);
        break;
      case "tabIndex":
        So(t, "tabindex", a);
        break;
      case "dir":
      case "role":
      case "viewBox":
      case "width":
      case "height":
        So(t, n, a);
        break;
      case "style":
        Nh(t, a, c);
        return;
      case "data":
        if (e !== "object") {
          So(t, "data", a);
          break;
        }
      case "src":
      case "href":
        if (a === "" && (e !== "a" || n !== "href")) {
          t.removeAttribute(n);
          break;
        }
        if (a == null || typeof a == "function" || typeof a == "symbol" || typeof a == "boolean") {
          t.removeAttribute(n);
          break;
        }
        a = xo(a), t.setAttribute(n, a);
        break;
      case "action":
      case "formAction":
        if (typeof a == "function") {
          t.setAttribute(
            n,
            "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')"
          );
          break;
        } else
          typeof c == "function" && (n === "formAction" ? (e !== "input" && jt(t, e, "name", u.name, u, null), jt(
            t,
            e,
            "formEncType",
            u.formEncType,
            u,
            null
          ), jt(
            t,
            e,
            "formMethod",
            u.formMethod,
            u,
            null
          ), jt(
            t,
            e,
            "formTarget",
            u.formTarget,
            u,
            null
          )) : (jt(t, e, "encType", u.encType, u, null), jt(t, e, "method", u.method, u, null), jt(t, e, "target", u.target, u, null)));
        if (a == null || typeof a == "symbol" || typeof a == "boolean") {
          t.removeAttribute(n);
          break;
        }
        a = xo(a), t.setAttribute(n, a);
        break;
      case "onClick":
        a != null && (t.onclick = Nn);
        return;
      case "onScroll":
        a != null && At("scroll", t);
        return;
      case "onScrollEnd":
        a != null && At("scrollend", t);
        return;
      case "dangerouslySetInnerHTML":
        if (a != null) {
          if (typeof a != "object" || !("__html" in a))
            throw Error(r(61));
          if (n = a.__html, n != null) {
            if (u.children != null) throw Error(r(60));
            c?.__html !== n && (t.innerHTML = n);
          }
        }
        break;
      case "multiple":
        t.multiple = a && typeof a != "function" && typeof a != "symbol";
        break;
      case "muted":
        t.muted = a && typeof a != "function" && typeof a != "symbol";
        break;
      case "suppressContentEditableWarning":
      case "suppressHydrationWarning":
      case "defaultValue":
      case "defaultChecked":
      case "innerHTML":
      case "ref":
        break;
      case "autoFocus":
        break;
      case "xlinkHref":
        if (a == null || typeof a == "function" || typeof a == "boolean" || typeof a == "symbol") {
          t.removeAttribute("xlink:href");
          break;
        }
        n = xo(a), t.setAttributeNS(
          "http://www.w3.org/1999/xlink",
          "xlink:href",
          n
        );
        break;
      case "contentEditable":
      case "spellCheck":
      case "draggable":
      case "value":
      case "autoReverse":
      case "externalResourcesRequired":
      case "focusable":
      case "preserveAlpha":
        a != null && typeof a != "function" && typeof a != "symbol" ? t.setAttribute(n, a) : t.removeAttribute(n);
        break;
      case "inert":
      case "allowFullScreen":
      case "async":
      case "autoPlay":
      case "controls":
      case "credentialless":
      case "default":
      case "defer":
      case "disabled":
      case "disablePictureInPicture":
      case "disableRemotePlayback":
      case "formNoValidate":
      case "hidden":
      case "loop":
      case "noModule":
      case "noValidate":
      case "open":
      case "playsInline":
      case "readOnly":
      case "required":
      case "reversed":
      case "scoped":
      case "seamless":
      case "itemScope":
        a && typeof a != "function" && typeof a != "symbol" ? t.setAttribute(n, "") : t.removeAttribute(n);
        break;
      case "capture":
      case "download":
        a === !0 ? t.setAttribute(n, "") : a !== !1 && a != null && typeof a != "function" && typeof a != "symbol" ? t.setAttribute(n, a) : t.removeAttribute(n);
        break;
      case "cols":
      case "rows":
      case "size":
      case "span":
        a != null && typeof a != "function" && typeof a != "symbol" && !isNaN(a) && 1 <= a ? t.setAttribute(n, a) : t.removeAttribute(n);
        break;
      case "rowSpan":
      case "start":
        a == null || typeof a == "function" || typeof a == "symbol" || isNaN(a) ? t.removeAttribute(n) : t.setAttribute(n, a);
        break;
      case "popover":
        At("beforetoggle", t), At("toggle", t), po(t, "popover", a);
        break;
      case "xlinkActuate":
        Zn(
          t,
          "http://www.w3.org/1999/xlink",
          "xlink:actuate",
          a
        );
        break;
      case "xlinkArcrole":
        Zn(
          t,
          "http://www.w3.org/1999/xlink",
          "xlink:arcrole",
          a
        );
        break;
      case "xlinkRole":
        Zn(
          t,
          "http://www.w3.org/1999/xlink",
          "xlink:role",
          a
        );
        break;
      case "xlinkShow":
        Zn(
          t,
          "http://www.w3.org/1999/xlink",
          "xlink:show",
          a
        );
        break;
      case "xlinkTitle":
        Zn(
          t,
          "http://www.w3.org/1999/xlink",
          "xlink:title",
          a
        );
        break;
      case "xlinkType":
        Zn(
          t,
          "http://www.w3.org/1999/xlink",
          "xlink:type",
          a
        );
        break;
      case "xmlBase":
        Zn(
          t,
          "http://www.w3.org/XML/1998/namespace",
          "xml:base",
          a
        );
        break;
      case "xmlLang":
        Zn(
          t,
          "http://www.w3.org/XML/1998/namespace",
          "xml:lang",
          a
        );
        break;
      case "xmlSpace":
        Zn(
          t,
          "http://www.w3.org/XML/1998/namespace",
          "xml:space",
          a
        );
        break;
      case "is":
        po(t, "is", a);
        break;
      case "innerText":
      case "textContent":
        return;
      default:
        if (!(2 < n.length) || n[0] !== "o" && n[0] !== "O" || n[1] !== "n" && n[1] !== "N")
          n = k1.get(n) || n, po(t, n, a);
        else return;
    }
    Yt = !0;
  }
  function qf(t, e, n, a, u, c) {
    switch (n) {
      case "style":
        Nh(t, a, c);
        return;
      case "dangerouslySetInnerHTML":
        if (a != null) {
          if (typeof a != "object" || !("__html" in a))
            throw Error(r(61));
          if (n = a.__html, n != null) {
            if (u.children != null) throw Error(r(60));
            c?.__html !== n && (t.innerHTML = n);
          }
        }
        break;
      case "children":
        if (typeof a == "string") Ha(t, a);
        else if (typeof a == "number" || typeof a == "bigint")
          Ha(t, "" + a);
        else return;
        break;
      case "onScroll":
        a != null && At("scroll", t);
        return;
      case "onScrollEnd":
        a != null && At("scrollend", t);
        return;
      case "onClick":
        a != null && (t.onclick = Nn);
        return;
      case "suppressContentEditableWarning":
      case "suppressHydrationWarning":
      case "innerHTML":
      case "ref":
        return;
      case "innerText":
      case "textContent":
        return;
      default:
        if (!vo.hasOwnProperty(n))
          t: {
            if (n[0] === "o" && n[1] === "n" && (u = n.endsWith("Capture"), c = n.slice(2, u ? n.length - 7 : void 0), e = t[be] || null, e = e != null ? e[n] : null, typeof e == "function" && t.removeEventListener(c, e, u), typeof a == "function")) {
              typeof e != "function" && e !== null && (n in t ? t[n] = null : t.hasAttribute(n) && t.removeAttribute(n)), t.addEventListener(c, a, u);
              break t;
            }
            Yt = !0, n in t ? t[n] = a : a === !0 ? t.setAttribute(n, "") : po(t, n, a);
          }
        return;
    }
    Yt = !0;
  }
  function pe(t, e, n) {
    switch (e) {
      case "div":
      case "span":
      case "svg":
      case "path":
      case "a":
      case "g":
      case "p":
      case "li":
        break;
      case "img":
        At("error", t), At("load", t);
        var a = !1, u = !1, c;
        for (c in n)
          if (n.hasOwnProperty(c)) {
            var h = n[c];
            if (h != null)
              switch (c) {
                case "src":
                  a = !0;
                  break;
                case "srcSet":
                  u = !0;
                  break;
                case "children":
                case "dangerouslySetInnerHTML":
                  throw Error(r(137, e));
                default:
                  jt(t, e, c, h, n, null);
              }
          }
        u && jt(t, e, "srcSet", n.srcSet, n, null), a && jt(t, e, "src", n.src, n, null);
        return;
      case "input":
        At("invalid", t);
        var x = c = h = u = null, z = null, q = null;
        for (a in n)
          if (n.hasOwnProperty(a)) {
            var $ = n[a];
            if ($ != null)
              switch (a) {
                case "name":
                  u = $;
                  break;
                case "type":
                  h = $;
                  break;
                case "checked":
                  z = $;
                  break;
                case "defaultChecked":
                  q = $;
                  break;
                case "value":
                  c = $;
                  break;
                case "defaultValue":
                  x = $;
                  break;
                case "children":
                case "dangerouslySetInnerHTML":
                  if ($ != null)
                    throw Error(r(137, e));
                  break;
                default:
                  jt(t, e, a, $, n, null);
              }
          }
        bh(
          t,
          c,
          x,
          z,
          q,
          h,
          u,
          !1
        );
        return;
      case "select":
        At("invalid", t), a = h = c = null;
        for (u in n)
          if (n.hasOwnProperty(u) && (x = n[u], x != null))
            switch (u) {
              case "value":
                c = x;
                break;
              case "defaultValue":
                h = x;
                break;
              case "multiple":
                a = x;
              default:
                jt(t, e, u, x, n, null);
            }
        e = c, n = h, t.multiple = !!a, e != null ? Ra(t, !!a, e, !1) : n != null && Ra(t, !!a, n, !0);
        return;
      case "textarea":
        At("invalid", t), c = u = a = null;
        for (h in n)
          if (n.hasOwnProperty(h) && (x = n[h], x != null))
            switch (h) {
              case "value":
                a = x;
                break;
              case "defaultValue":
                u = x;
                break;
              case "children":
                c = x;
                break;
              case "dangerouslySetInnerHTML":
                if (x != null) throw Error(r(91));
                break;
              default:
                jt(t, e, h, x, n, null);
            }
        _h(t, a, u, c);
        return;
      case "option":
        for (z in n)
          n.hasOwnProperty(z) && (a = n[z], a != null) && (z === "selected" ? t.selected = a && typeof a != "function" && typeof a != "symbol" : jt(t, e, z, a, n, null));
        return;
      case "dialog":
        At("beforetoggle", t), At("toggle", t), At("cancel", t), At("close", t);
        break;
      case "iframe":
      case "object":
        At("load", t);
        break;
      case "video":
      case "audio":
        for (a = 0; a < Eu.length; a++)
          At(Eu[a], t);
        break;
      case "image":
        At("error", t), At("load", t);
        break;
      case "details":
        At("toggle", t);
        break;
      case "embed":
      case "source":
      case "link":
        At("error", t), At("load", t);
      case "area":
      case "base":
      case "br":
      case "col":
      case "hr":
      case "keygen":
      case "meta":
      case "param":
      case "track":
      case "wbr":
      case "menuitem":
        for (q in n)
          if (n.hasOwnProperty(q) && (a = n[q], a != null))
            switch (q) {
              case "children":
              case "dangerouslySetInnerHTML":
                throw Error(r(137, e));
              default:
                jt(t, e, q, a, n, null);
            }
        return;
      default:
        if (Xr(e)) {
          for ($ in n)
            n.hasOwnProperty($) && (a = n[$], a !== void 0 && qf(
              t,
              e,
              $,
              a,
              n,
              void 0
            ));
          return;
        }
    }
    for (x in n)
      n.hasOwnProperty(x) && (a = n[x], a != null && jt(t, e, x, a, n, null));
  }
  var Dx = {};
  function Rx(t, e, n, a) {
    switch (e) {
      case "div":
      case "span":
      case "svg":
      case "path":
      case "a":
      case "g":
      case "p":
      case "li":
        break;
      case "input":
        var u = null, c = null, h = null, x = null, z = null, q = null, $ = null;
        for (Q in n) {
          var nt = n[Q];
          if (n.hasOwnProperty(Q) && nt != null)
            switch (Q) {
              case "checked":
                break;
              case "value":
                break;
              case "defaultValue":
                z = nt;
              default:
                a.hasOwnProperty(Q) || jt(t, e, Q, null, a, nt);
            }
        }
        for (var Y in a) {
          var Q = a[Y];
          if (nt = n[Y], a.hasOwnProperty(Y) && (Q != null || nt != null))
            switch (Y) {
              case "type":
                Q !== nt && (Yt = !0), c = Q;
                break;
              case "name":
                Q !== nt && (Yt = !0), u = Q;
                break;
              case "checked":
                Q !== nt && (Yt = !0), q = Q;
                break;
              case "defaultChecked":
                Q !== nt && (Yt = !0), $ = Q;
                break;
              case "value":
                Q !== nt && (Yt = !0), h = Q;
                break;
              case "defaultValue":
                Q !== nt && (Yt = !0), x = Q;
                break;
              case "children":
              case "dangerouslySetInnerHTML":
                if (Q != null)
                  throw Error(r(137, e));
                break;
              default:
                Q !== nt && jt(
                  t,
                  e,
                  Y,
                  Q,
                  a,
                  nt
                );
            }
        }
        Lr(
          t,
          h,
          x,
          z,
          q,
          $,
          c,
          u
        );
        return;
      case "select":
        Q = h = x = Y = null;
        for (c in n)
          if (z = n[c], n.hasOwnProperty(c) && z != null)
            switch (c) {
              case "value":
                break;
              case "multiple":
                Q = z;
              default:
                a.hasOwnProperty(c) || jt(
                  t,
                  e,
                  c,
                  null,
                  a,
                  z
                );
            }
        for (u in a)
          if (c = a[u], z = n[u], a.hasOwnProperty(u) && (c != null || z != null))
            switch (u) {
              case "value":
                c !== z && (Yt = !0), Y = c;
                break;
              case "defaultValue":
                c !== z && (Yt = !0), x = c;
                break;
              case "multiple":
                c !== z && (Yt = !0), h = c;
              default:
                c !== z && jt(
                  t,
                  e,
                  u,
                  c,
                  a,
                  z
                );
            }
        e = x, n = h, a = Q, Y != null ? Ra(t, !!n, Y, !1) : !!a != !!n && (e != null ? Ra(t, !!n, e, !0) : Ra(t, !!n, n ? [] : "", !1));
        return;
      case "textarea":
        Q = Y = null;
        for (x in n)
          if (u = n[x], n.hasOwnProperty(x) && u != null && !a.hasOwnProperty(x))
            switch (x) {
              case "value":
                break;
              case "children":
                break;
              default:
                jt(t, e, x, null, a, u);
            }
        for (h in a)
          if (u = a[h], c = n[h], a.hasOwnProperty(h) && (u != null || c != null))
            switch (h) {
              case "value":
                u !== c && (Yt = !0), Y = u;
                break;
              case "defaultValue":
                u !== c && (Yt = !0), Q = u;
                break;
              case "children":
                break;
              case "dangerouslySetInnerHTML":
                if (u != null) throw Error(r(91));
                break;
              default:
                u !== c && jt(t, e, h, u, a, c);
            }
        Eh(t, Y, Q);
        return;
      case "option":
        for (var ht in n)
          Y = n[ht], n.hasOwnProperty(ht) && Y != null && !a.hasOwnProperty(ht) && (ht === "selected" ? t.selected = !1 : jt(
            t,
            e,
            ht,
            null,
            a,
            Y
          ));
        for (z in a)
          Y = a[z], Q = n[z], a.hasOwnProperty(z) && Y !== Q && (Y != null || Q != null) && (z === "selected" ? (Y !== Q && (Yt = !0), t.selected = Y && typeof Y != "function" && typeof Y != "symbol") : jt(
            t,
            e,
            z,
            Y,
            a,
            Q
          ));
        return;
      case "img":
      case "link":
      case "area":
      case "base":
      case "br":
      case "col":
      case "embed":
      case "hr":
      case "keygen":
      case "meta":
      case "param":
      case "source":
      case "track":
      case "wbr":
      case "menuitem":
        for (var yt in n)
          Y = n[yt], n.hasOwnProperty(yt) && Y != null && !a.hasOwnProperty(yt) && jt(t, e, yt, null, a, Y);
        for (q in a)
          if (Y = a[q], Q = n[q], a.hasOwnProperty(q) && Y !== Q && (Y != null || Q != null))
            switch (q) {
              case "children":
              case "dangerouslySetInnerHTML":
                if (Y != null)
                  throw Error(r(137, e));
                break;
              default:
                jt(
                  t,
                  e,
                  q,
                  Y,
                  a,
                  Q
                );
            }
        return;
      default:
        if (Xr(e)) {
          for (var Tt in n)
            Y = n[Tt], n.hasOwnProperty(Tt) && Y !== void 0 && !a.hasOwnProperty(Tt) && qf(
              t,
              e,
              Tt,
              void 0,
              a,
              Y
            );
          for ($ in a)
            Y = a[$], Q = n[$], !a.hasOwnProperty($) || Y === Q || Y === void 0 && Q === void 0 || qf(
              t,
              e,
              $,
              Y,
              a,
              Q
            );
          return;
        }
    }
    for (var L in n)
      Y = n[L], n.hasOwnProperty(L) && Y != null && !a.hasOwnProperty(L) && jt(t, e, L, null, a, Y);
    for (nt in a)
      Y = a[nt], Q = n[nt], !a.hasOwnProperty(nt) || Y === Q || Y == null && Q == null || jt(t, e, nt, Y, a, Q);
  }
  function Om(t) {
    switch (t) {
      case "css":
      case "script":
      case "font":
      case "img":
      case "image":
      case "input":
      case "link":
        return !0;
      default:
        return !1;
    }
  }
  function Hx() {
    if (typeof performance.getEntriesByType == "function") {
      for (var t = 0, e = 0, n = performance.getEntriesByType("resource"), a = 0; a < n.length; a++) {
        var u = n[a], c = u.transferSize, h = u.initiatorType, x = u.duration;
        if (c && x && Om(h)) {
          for (h = 0, x = u.responseEnd, a += 1; a < n.length; a++) {
            var z = n[a], q = z.startTime;
            if (q > x) break;
            var $ = z.transferSize, nt = z.initiatorType;
            $ && Om(nt) && (z = z.responseEnd, h += $ * (z < x ? 1 : (x - q) / (z - q)));
          }
          if (--a, e += 8 * (c + h) / (u.duration / 1e3), t++, 10 < t) break;
        }
      }
      if (0 < t) return e / t / 1e6;
    }
    return navigator.connection && (t = navigator.connection.downlink, typeof t == "number") ? t : 5;
  }
  var Xf = null, jf = null;
  function wu(t) {
    return t.nodeType === 9 ? t : t.ownerDocument;
  }
  function Dm(t) {
    switch (t) {
      case "http://www.w3.org/2000/svg":
        return 1;
      case "http://www.w3.org/1998/Math/MathML":
        return 2;
      default:
        return 0;
    }
  }
  function Rm(t, e) {
    if (t === 0)
      switch (e) {
        case "svg":
          return 1;
        case "math":
          return 2;
        default:
          return 0;
      }
    return t === 1 && e === "foreignObject" ? 0 : t;
  }
  function Hm(t, e, n, a) {
    return n = wu(
      n
    ).createElement(t), n[oe] = a, n[be] = e, pe(n, t, e), ee(n), n;
  }
  function Zf(t, e) {
    return t === "textarea" || t === "noscript" || typeof e.children == "string" || typeof e.children == "number" || typeof e.children == "bigint" || typeof e.dangerouslySetInnerHTML == "object" && e.dangerouslySetInnerHTML !== null && e.dangerouslySetInnerHTML.__html != null;
  }
  var Gf = null;
  function Ux() {
    var t = window.event;
    return t && t.type === "popstate" ? t === Gf ? !1 : (Gf = t, !0) : (Gf = null, !1);
  }
  var Qf = typeof setTimeout == "function" ? setTimeout : void 0, Bx = typeof clearTimeout == "function" ? clearTimeout : void 0, Um = typeof Promise == "function" ? Promise : void 0, Bm = typeof requestAnimationFrame == "function" ? requestAnimationFrame : Qf, Yx = typeof queueMicrotask == "function" ? queueMicrotask : typeof Um < "u" ? function(t) {
    return Um.resolve(null).then(t).catch(Vx);
  } : Qf;
  function Vx(t) {
    setTimeout(function() {
      throw t;
    });
  }
  function Al(t) {
    return t === "head";
  }
  function Ym(t, e) {
    var n = e, a = 0;
    do {
      var u = n.nextSibling;
      if (t.removeChild(n), u && u.nodeType === 8)
        if (n = u.data, n === "/$" || n === "/&") {
          if (a === 0) {
            t.removeChild(u), vi(e);
            return;
          }
          a--;
        } else if (n === "$" || n === "$?" || n === "$~" || n === "$!" || n === "&")
          a++;
        else if (n === "html")
          Pf(
            t.ownerDocument.documentElement
          );
        else if (n === "head") {
          n = t.ownerDocument.head, Pf(n);
          for (var c = n.firstChild; c; ) {
            var h = c.nextSibling, x = c.nodeName;
            c[Kl] || x === "SCRIPT" || x === "STYLE" || x === "LINK" && c.rel.toLowerCase() === "stylesheet" || n.removeChild(c), c = h;
          }
        } else
          n === "body" && Pf(t.ownerDocument.body);
      n = u;
    } while (n);
    vi(e);
  }
  function Vm(t, e) {
    var n = t;
    t = 0;
    do {
      var a = n.nextSibling;
      if (n.nodeType === 1 ? e ? (n._stashedDisplay = n.style.display, n.style.display = "none") : (n.style.display = n._stashedDisplay || "", n.getAttribute("style") === "" && n.removeAttribute("style")) : n.nodeType === 3 && (e ? (n._stashedText = n.nodeValue, n.nodeValue = "") : n.nodeValue = n._stashedText || ""), a && a.nodeType === 8)
        if (n = a.data, n === "/$") {
          if (t === 0) break;
          t--;
        } else
          n !== "$" && n !== "$?" && n !== "$~" && n !== "$!" || t++;
      n = a;
    } while (n);
  }
  function Lm(t, e, n) {
    if (e = CSS.escape(e) !== e ? "r-" + btoa(e).replace(/=/g, "") : e, t.style.viewTransitionName = e, n != null && (t.style.viewTransitionClass = n), n = getComputedStyle(t), n.display === "inline") {
      if (e = t.getClientRects(), e.length === 1) var a = 1;
      else
        for (var u = a = 0; u < e.length; u++) {
          var c = e[u];
          0 < c.width && 0 < c.height && a++;
        }
      a === 1 && (t = t.style, t.display = e.length === 1 ? "inline-block" : "block", t.marginTop = "-" + n.paddingTop, t.marginBottom = "-" + n.paddingBottom);
    }
  }
  function qm(t, e) {
    t = t.style, e = e.style;
    var n = e != null ? e.hasOwnProperty("viewTransitionName") ? e.viewTransitionName : e.hasOwnProperty("view-transition-name") ? e["view-transition-name"] : null : null;
    t.viewTransitionName = n == null || typeof n == "boolean" ? "" : ("" + n).trim(), n = e != null ? e.hasOwnProperty("viewTransitionClass") ? e.viewTransitionClass : e.hasOwnProperty("view-transition-class") ? e["view-transition-class"] : null : null, t.viewTransitionClass = n == null || typeof n == "boolean" ? "" : ("" + n).trim(), t.display === "inline-block" && (e == null ? t.display = t.margin = "" : (n = e.display, t.display = n == null || typeof n == "boolean" ? "" : n, n = e.margin, n != null ? t.margin = n : (n = e.hasOwnProperty("marginTop") ? e.marginTop : e["margin-top"], t.marginTop = n == null || typeof n == "boolean" ? "" : n, e = e.hasOwnProperty("marginBottom") ? e.marginBottom : e["margin-bottom"], t.marginBottom = e == null || typeof e == "boolean" ? "" : e)));
  }
  function Lx(t, e, n) {
    return n = n.ownerDocument.defaultView, {
      rect: t,
      abs: e.position === "absolute" || e.position === "fixed",
      clip: e.clipPath !== "none" || e.overflow !== "visible" || e.filter !== "none" || e.mask !== "none" || e.mask !== "none" || e.borderRadius !== "0px",
      view: 0 <= t.bottom && 0 <= t.right && t.top <= n.innerHeight && t.left <= n.innerWidth
    };
  }
  function Kf(t) {
    var e = t.getBoundingClientRect(), n = getComputedStyle(t);
    return Lx(e, n, t);
  }
  function qx(t) {
    return t.documentElement.clientHeight;
  }
  function Xx(t) {
    this.addEventListener("load", t), this.addEventListener("error", t);
  }
  function jx(t, e, n, a, u, c, h, x, z) {
    var q = e.nodeType === 9 ? e : e.ownerDocument;
    try {
      var $ = q.startViewTransition({
        update: function() {
          var Y = q.defaultView, Q = Y.navigation && Y.navigation.transition, ht = q.fonts.status;
          a();
          var yt = [];
          if (ht === "loaded" && (qx(q), q.fonts.status === "loading" && yt.push(q.fonts.ready)), ht = yt.length, t !== null)
            for (var Tt = t.suspenseyImages, L = 0, D = 0; D < Tt.length; D++) {
              var G = Tt[D];
              if (!G.complete) {
                var et = G.getBoundingClientRect();
                if (0 < et.bottom && 0 < et.right && et.top < Y.innerHeight && et.left < Y.innerWidth) {
                  if (L += oy(G), L > Cc) {
                    yt.length = ht;
                    break;
                  }
                  G = new Promise(
                    Xx.bind(G)
                  ), yt.push(G);
                }
              }
            }
          if (0 < yt.length)
            return Y = Promise.race([
              Promise.all(yt),
              new Promise(function(mt) {
                return setTimeout(mt, 500);
              })
            ]).then(u, u), (Q ? Promise.allSettled([Q.finished, Y]) : Y).then(c, c);
          if (u(), Q)
            return Q.finished.then(
              c,
              c
            );
          c();
        },
        types: n
      });
      q.__reactViewTransition = $;
      var nt = [];
      return $.ready.then(
        function() {
          for (var Y = q.documentElement.getAnimations({
            subtree: !0
          }), Q = 0; Q < Y.length; Q++) {
            var ht = Y[Q], yt = ht.effect, Tt = yt.pseudoElement;
            if (Tt != null && Tt.startsWith("::view-transition")) {
              nt.push(ht), ht = yt.getKeyframes();
              for (var L = Tt = void 0, D = !0, G = 0; G < ht.length; G++) {
                var et = ht[G], mt = et.width;
                if (Tt === void 0) Tt = mt;
                else if (Tt !== mt) {
                  D = !1;
                  break;
                }
                if (mt = et.height, L === void 0) L = mt;
                else if (L !== mt) {
                  D = !1;
                  break;
                }
                delete et.width, delete et.height, et.transform === "none" && delete et.transform;
              }
              D && Tt !== void 0 && L !== void 0 && (yt.setKeyframes(ht), D = getComputedStyle(
                yt.target,
                yt.pseudoElement
              ), D.width !== Tt || D.height !== L) && (D = ht[0], D.width = Tt, D.height = L, D = ht[ht.length - 1], D.width = Tt, D.height = L, yt.setKeyframes(ht));
            }
          }
          h();
        },
        function(Y) {
          q.__reactViewTransition === $ && (q.__reactViewTransition = null);
          try {
            typeof Y == "object" && Y !== null && Y.name === "InvalidStateError" && (Y.message === "View transition was skipped because document visibility state is hidden." || Y.message === "Skipping view transition because document visibility state has become hidden." || Y.message === "Skipping view transition because viewport size changed." || Y.message === "Transition was aborted because of invalid state") && (Y = null), Y !== null && z(Y);
          } finally {
            a(), u(), h();
          }
        }
      ), $.finished.finally(function() {
        for (var Y = 0; Y < nt.length; Y++)
          nt[Y].cancel();
        q.__reactViewTransition === $ && (q.__reactViewTransition = null), x();
      }), $;
    } catch {
      return a(), u(), h(), null;
    }
  }
  function ha(t, e) {
    this._scope = document.documentElement, this._selector = "::view-transition-" + t + "(" + e + ")";
  }
  ha.prototype.animate = function(t, e) {
    return e = typeof e == "number" ? { duration: e } : R({}, e), e.pseudoElement = this._selector, this._scope.animate(t, e);
  }, ha.prototype.getAnimations = function() {
    for (var t = this._scope, e = this._selector, n = t.getAnimations({ subtree: !0 }), a = [], u = 0; u < n.length; u++) {
      var c = n[u].effect;
      c !== null && c.target === t && c.pseudoElement === e && a.push(n[u]);
    }
    return a;
  }, ha.prototype.getComputedStyle = function() {
    return getComputedStyle(this._scope, this._selector);
  };
  function Xm(t) {
    return {
      name: t,
      group: new ha("group", t),
      imagePair: new ha("image-pair", t),
      old: new ha("old", t),
      new: new ha("new", t)
    };
  }
  function Ke(t) {
    this._fragmentFiber = t, this._observers = this._eventListeners = null;
  }
  Ke.prototype.addEventListener = function(t, e, n) {
    var a = null, u = null;
    if (!(n != null && typeof n != "boolean" && (a = n.signal || null, a !== null && a.aborted))) {
      this._eventListeners === null && (this._eventListeners = []);
      var c = this._eventListeners;
      if (Zm(c, t, e, n) === -1) {
        var h = this, x = e;
        n != null && typeof n != "boolean" && n.once === !0 && (x = function(z) {
          h.removeEventListener(
            t,
            e,
            n
          ), typeof e == "function" ? e.call(this, z) : e.handleEvent(z);
        }), a !== null && (u = h.removeEventListener.bind(
          h,
          t,
          e,
          n
        ), a.addEventListener("abort", u, { once: !0 }), u = a.removeEventListener.bind(a, "abort", u)), a = fi(n), c.push({
          type: t,
          listener: e,
          optionsOrUseCapture: n,
          attachedListener: x,
          cleanup: u
        }), m(
          this._fragmentFiber.child,
          !1,
          Zx,
          t,
          x,
          a
        );
      }
      this._eventListeners = c;
    }
  };
  function Zx(t, e, n, a) {
    return N(t).addEventListener(
      e,
      n,
      a
    ), !1;
  }
  Ke.prototype.removeEventListener = function(t, e, n) {
    var a = this._eventListeners;
    if (a !== null && (e = Zm(
      a,
      t,
      e,
      n
    ), e !== -1)) {
      var u = a[e];
      n = u.attachedListener;
      var c = u.cleanup;
      u = fi(u.optionsOrUseCapture), m(
        this._fragmentFiber.child,
        !1,
        Gx,
        t,
        n,
        u
      ), a.splice(e, 1), c !== null && c();
    }
  };
  function Gx(t, e, n, a) {
    return N(t).removeEventListener(
      e,
      n,
      a
    ), !1;
  }
  function fi(t) {
    return t != null && typeof t != "boolean" && (t.once === !0 || t.signal instanceof AbortSignal) ? { capture: t.capture, passive: t.passive } : t;
  }
  function jm(t) {
    return t == null ? "c=0" : typeof t == "boolean" ? "c=" + (t ? "1" : "0") : "c=" + (t.capture ? "1" : "0");
  }
  function Zm(t, e, n, a) {
    if (t.length === 0) return -1;
    a = jm(a);
    for (var u = 0; u < t.length; u++) {
      var c = t[u];
      if (c.type === e && c.listener === n && jm(c.optionsOrUseCapture) === a)
        return u;
    }
    return -1;
  }
  Ke.prototype.dispatchEvent = function(t) {
    var e = p(
      this._fragmentFiber
    );
    if (e === null) return !0;
    e = N(e);
    var n = this._eventListeners;
    if (n !== null && 0 < n.length || !t.bubbles) {
      var a = e.nodeType === 9 ? e.createComment("") : document.createTextNode("");
      if (n)
        for (var u = 0; u < n.length; u++) {
          var c = n[u];
          a.addEventListener(
            c.type,
            c.attachedListener,
            fi(c.optionsOrUseCapture)
          );
        }
      if (e.appendChild(a), t = a.dispatchEvent(t), n)
        for (u = 0; u < n.length; u++)
          c = n[u], a.removeEventListener(
            c.type,
            c.attachedListener,
            fi(c.optionsOrUseCapture)
          );
      return e.removeChild(a), t;
    }
    return e.dispatchEvent(t);
  }, Ke.prototype.focus = function(t) {
    m(
      this._fragmentFiber.child,
      !0,
      Gm,
      t,
      void 0,
      void 0
    );
  };
  function Gm(t, e) {
    return t.tag === 6 ? !1 : (t = N(t), nb(t, e));
  }
  Ke.prototype.focusLast = function(t) {
    var e = [];
    m(
      this._fragmentFiber.child,
      !0,
      $f,
      e,
      void 0,
      void 0
    );
    for (var n = e.length - 1; 0 <= n && !Gm(e[n], t); n--) ;
  };
  function $f(t, e) {
    return e.push(t), !1;
  }
  Ke.prototype.blur = function() {
    var t = p(
      this._fragmentFiber
    );
    t !== null && (t = N(t), t = wu(t).activeElement, t !== null && m(
      this._fragmentFiber.child,
      !1,
      Qx,
      t,
      void 0,
      void 0
    ));
  };
  function Qx(t, e) {
    return t.tag === 6 ? !1 : (t = N(t), t === e || t.contains(e) ? (e.blur(), !0) : !1);
  }
  Ke.prototype.observeUsing = function(t) {
    this._observers === null && (this._observers = /* @__PURE__ */ new Set()), this._observers.add(t), m(
      this._fragmentFiber.child,
      !1,
      Kx,
      t,
      void 0,
      void 0
    );
  };
  function Kx(t, e) {
    return t.tag === 6 || (t = N(t), e.observe(t)), !1;
  }
  Ke.prototype.unobserveUsing = function(t) {
    var e = this._observers;
    if (e !== null && e.has(t)) {
      e.delete(t), m(
        this._fragmentFiber.child,
        !1,
        $x,
        t,
        void 0,
        void 0
      );
      for (var n = e = 0; n < gn.length; n++) {
        var a = gn[n];
        a.fragmentInstance === this && a.observer === t ? t.unobserve(a.instance) : gn[e++] = a;
      }
      gn.length = e;
    }
  };
  function $x(t, e) {
    return t.tag === 6 || (t = N(t), e.unobserve(t)), !1;
  }
  var gn = [], Jf = !1;
  function Jx(t, e, n) {
    gn.push({
      fragmentInstance: t,
      observer: e,
      instance: n
    }), Jf || (Jf = !0, lb(function() {
      Jf = !1;
      var a = gn;
      gn = [];
      for (var u = 0; u < a.length; u++) {
        var c = a[u];
        c.observer.unobserve(c.instance);
      }
    }));
  }
  Ke.prototype.getClientRects = function() {
    var t = [];
    return m(
      this._fragmentFiber.child,
      !1,
      Ix,
      t,
      void 0,
      void 0
    ), t;
  };
  function Ix(t, e) {
    if (t.tag === 6) {
      t = t.stateNode;
      var n = t.ownerDocument.createRange();
      n.selectNodeContents(t), e.push.apply(e, n.getClientRects());
    } else
      t = N(t), e.push.apply(e, t.getClientRects());
    return !1;
  }
  Ke.prototype.getRootNode = function(t) {
    var e = p(
      this._fragmentFiber
    );
    return e === null ? this : N(e).getRootNode(t);
  }, Ke.prototype.compareDocumentPosition = function(t) {
    var e = p(
      this._fragmentFiber
    );
    if (e === null) return Node.DOCUMENT_POSITION_DISCONNECTED;
    var n = [];
    m(
      this._fragmentFiber.child,
      !1,
      $f,
      n,
      void 0,
      void 0
    );
    var a = N(e);
    if (n.length === 0) {
      if (n = a, b(this._fragmentFiber)) {
        t: {
          for (e = this._fragmentFiber.return; e !== null; ) {
            if (e.tag === 4) {
              e = e.stateNode.containerInfo;
              break t;
            }
            if (e.tag === 3 || e.tag === 5 || e.tag === 27)
              break;
            e = e.return;
          }
          e = null;
        }
        e != null && (n = e);
      }
      e = this._fragmentFiber;
      var u = a = n.compareDocumentPosition(t);
      return n === t ? u = Node.DOCUMENT_POSITION_CONTAINS : a & Node.DOCUMENT_POSITION_CONTAINED_BY && (n = E(e)[1], n === null ? u = Node.DOCUMENT_POSITION_PRECEDING : (t = N(n).compareDocumentPosition(
        t
      ), u = t === 0 || t & Node.DOCUMENT_POSITION_FOLLOWING ? Node.DOCUMENT_POSITION_FOLLOWING : Node.DOCUMENT_POSITION_PRECEDING)), u |= Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC;
    }
    e = N(n[0]), u = N(n[n.length - 1]);
    var c = b(this._fragmentFiber) ? e.parentElement : a;
    if (c == null)
      return Node.DOCUMENT_POSITION_DISCONNECTED;
    a = c.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_CONTAINED_BY, c = c.compareDocumentPosition(u) & Node.DOCUMENT_POSITION_CONTAINED_BY;
    var h = e.compareDocumentPosition(t), x = u.compareDocumentPosition(t), z = h & Node.DOCUMENT_POSITION_CONTAINED_BY || x & Node.DOCUMENT_POSITION_CONTAINED_BY;
    return x = a && c && h & Node.DOCUMENT_POSITION_FOLLOWING && x & Node.DOCUMENT_POSITION_PRECEDING, e = a && e === t || c && u === t || z || x ? Node.DOCUMENT_POSITION_CONTAINED_BY : !a && e === t || !c && u === t ? Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC : h, e & Node.DOCUMENT_POSITION_DISCONNECTED || e & Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC || kx(
      e,
      this._fragmentFiber,
      n[0],
      n[n.length - 1],
      t
    ) ? e : Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC;
  };
  function kx(t, e, n, a, u) {
    var c = Xn(u);
    if (t & Node.DOCUMENT_POSITION_CONTAINED_BY) {
      if (n = !!c)
        t: {
          for (; c !== null; ) {
            if (c.tag === 7 && (c === e || c.alternate === e)) {
              n = !0;
              break t;
            }
            c = c.return;
          }
          n = !1;
        }
      return n;
    }
    if (t & Node.DOCUMENT_POSITION_CONTAINS) {
      if (c === null)
        return c = u.ownerDocument, u === c || u === c.documentElement || u === c.body;
      t: {
        for (c = e, e = p(e); c !== null; ) {
          if (!(c.tag !== 5 && c.tag !== 3 && c.tag !== 27 || c !== e && c.alternate !== e)) {
            c = !0;
            break t;
          }
          c = c.return;
        }
        c = !1;
      }
      return c;
    }
    return t & Node.DOCUMENT_POSITION_PRECEDING ? ((e = !!c) && !(e = c === n) && (e = B(
      n,
      c,
      j
    ), e === null ? e = !1 : (m(
      e,
      !0,
      _,
      c,
      n
    ), c = w, w = null, e = c !== null)), e) : t & Node.DOCUMENT_POSITION_FOLLOWING ? ((e = !!c) && !(e = c === a) && (e = B(
      a,
      c,
      j
    ), e === null ? e = !1 : (m(
      e,
      !0,
      A,
      c,
      a
    ), c = w, U = w = null, e = c !== null)), e) : !1;
  }
  function Qm(t, e) {
    var n = t.ownerDocument.createRange();
    n.selectNodeContents(t), t = n.getBoundingClientRect(), window.scrollTo(
      window.scrollX + t.left,
      e ? window.scrollY + t.top : window.scrollY + t.bottom - window.innerHeight
    );
  }
  Ke.prototype.scrollIntoView = function(t) {
    if (typeof t == "object") throw Error(r(566));
    var e = [];
    m(
      this._fragmentFiber.child,
      !1,
      $f,
      e,
      void 0,
      void 0
    );
    var n = t !== !1;
    if (e.length === 0) {
      var a = E(
        this._fragmentFiber
      );
      if (a = n ? a[1] || a[0] || p(this._fragmentFiber) : a[0] || a[1], a === null) return;
      if (a.tag === 6) {
        t = N(a), Qm(t, n);
        return;
      }
      if (a = N(a), a.nodeType !== 9) {
        if (a.nodeType === 11) {
          n = "host" in a ? a.host : null, n !== null && n.scrollIntoView(t);
          return;
        }
        a.scrollIntoView(t);
      }
    }
    for (a = n ? e.length - 1 : 0; a !== (n ? -1 : e.length); ) {
      var u = e[a];
      u.tag === 6 ? (u = N(u), Qm(u, n)) : N(u).scrollIntoView(t), a += n ? -1 : 1;
    }
  };
  function Fx(t, e) {
    return t = N(t), Km(t, e), !1;
  }
  function Km(t, e) {
    t.reactFragments == null && (t.reactFragments = /* @__PURE__ */ new Set()), t.reactFragments.add(e);
  }
  function $m(t, e) {
    var n = e._eventListeners;
    if (n !== null)
      for (var a = 0; a < n.length; a++) {
        var u = n[a];
        t.addEventListener(
          u.type,
          u.attachedListener,
          fi(u.optionsOrUseCapture)
        );
      }
    t.nodeType !== 3 && (n = e._observers, n !== null && n.forEach(function(c) {
      for (var h = 0, x = 0; x < gn.length; x++) {
        var z = gn[x];
        (z.fragmentInstance !== e || z.observer !== c || z.instance !== t) && (gn[h++] = z);
      }
      gn.length = h, c.observe(t);
    }), Km(t, e));
  }
  function Wx(t, e) {
    var n = e._eventListeners;
    if (n !== null)
      for (var a = 0; a < n.length; a++) {
        var u = n[a];
        t.removeEventListener(
          u.type,
          u.attachedListener,
          fi(u.optionsOrUseCapture)
        );
      }
    t.nodeType !== 3 && (n = e._observers, n !== null && n.forEach(function(c) {
      typeof c.rootMargin == "string" ? Jx(
        e,
        c,
        t
      ) : c.unobserve(t);
    }), t.reactFragments != null && t.reactFragments.delete(e));
  }
  function If(t) {
    var e = t.firstChild;
    for (e && e.nodeType === 10 && (e = e.nextSibling); e; ) {
      var n = e;
      switch (e = e.nextSibling, n.nodeName) {
        case "HTML":
        case "HEAD":
        case "BODY":
          If(n), Da(n);
          continue;
        case "SCRIPT":
        case "STYLE":
          continue;
        case "LINK":
          if (n.rel.toLowerCase() === "stylesheet") continue;
      }
      t.removeChild(n);
    }
  }
  function Px(t, e, n, a) {
    for (; t.nodeType === 1; ) {
      var u = n;
      if (t.nodeName.toLowerCase() !== e.toLowerCase()) {
        if (!a && (t.nodeName !== "INPUT" || t.type !== "hidden"))
          break;
      } else if (a) {
        if (!t[Kl])
          switch (e) {
            case "meta":
              if (!t.hasAttribute("itemprop")) break;
              return t;
            case "link":
              if (c = t.getAttribute("rel"), c === "stylesheet" && t.hasAttribute("data-precedence"))
                break;
              if (c !== u.rel || t.getAttribute("href") !== (u.href == null || u.href === "" ? null : u.href) || t.getAttribute("crossorigin") !== (u.crossOrigin == null ? null : u.crossOrigin) || t.getAttribute("title") !== (u.title == null ? null : u.title))
                break;
              return t;
            case "style":
              if (t.hasAttribute("data-precedence")) break;
              return t;
            case "script":
              if (c = t.getAttribute("src"), (c !== (u.src == null ? null : u.src) || t.getAttribute("type") !== (u.type == null ? null : u.type) || t.getAttribute("crossorigin") !== (u.crossOrigin == null ? null : u.crossOrigin)) && c && t.hasAttribute("async") && !t.hasAttribute("itemprop"))
                break;
              return t;
            default:
              return t;
          }
      } else if (e === "input" && t.type === "hidden") {
        var c = u.name == null ? null : "" + u.name;
        if (u.type === "hidden" && t.getAttribute("name") === c)
          return t;
      } else return t;
      if (t = an(t.nextSibling), t === null) break;
    }
    return null;
  }
  function tb(t, e, n) {
    if (e === "") return null;
    for (; t.nodeType !== 3; )
      if ((t.nodeType !== 1 || t.nodeName !== "INPUT" || t.type !== "hidden") && !n || (t = an(t.nextSibling), t === null)) return null;
    return t;
  }
  function Jm(t, e) {
    for (; t.nodeType !== 8; )
      if ((t.nodeType !== 1 || t.nodeName !== "INPUT" || t.type !== "hidden") && !e || (t = an(t.nextSibling), t === null)) return null;
    return t;
  }
  function kf(t) {
    return t.data === "$?" || t.data === "$~";
  }
  function Ff(t) {
    return t.data === "$!" || t.data === "$?" && t.ownerDocument.readyState !== "loading";
  }
  function eb(t, e) {
    var n = t.ownerDocument;
    if (t.data === "$~") t._reactRetry = e;
    else if (t.data !== "$?" || n.readyState !== "loading")
      e();
    else {
      var a = function() {
        e(), n.removeEventListener("DOMContentLoaded", a);
      };
      n.addEventListener("DOMContentLoaded", a), t._reactRetry = a;
    }
  }
  function an(t) {
    for (; t != null; t = t.nextSibling) {
      var e = t.nodeType;
      if (e === 1 || e === 3) break;
      if (e === 8) {
        if (e = t.data, e === "$" || e === "$!" || e === "$?" || e === "$~" || e === "&" || e === "F!" || e === "F")
          break;
        if (e === "/$" || e === "/&") return null;
      }
    }
    return t;
  }
  var Wf = null;
  function Im(t) {
    t = t.nextSibling;
    for (var e = 0; t; ) {
      if (t.nodeType === 8) {
        var n = t.data;
        if (n === "/$" || n === "/&") {
          if (e === 0)
            return an(t.nextSibling);
          e--;
        } else
          n !== "$" && n !== "$!" && n !== "$?" && n !== "$~" && n !== "&" || e++;
      }
      t = t.nextSibling;
    }
    return null;
  }
  function km(t) {
    t = t.previousSibling;
    for (var e = 0; t; ) {
      if (t.nodeType === 8) {
        var n = t.data;
        if (n === "$" || n === "$!" || n === "$?" || n === "$~" || n === "&") {
          if (e === 0) return t;
          e--;
        } else n !== "/$" && n !== "/&" || e++;
      }
      t = t.previousSibling;
    }
    return null;
  }
  function nb(t, e) {
    function n() {
      a = !0;
    }
    if (t.ownerDocument.activeElement === t) return !0;
    var a = !1;
    try {
      t.ownerDocument.addEventListener("focus", n, !0), (t.focus || HTMLElement.prototype.focus).call(t, e);
    } finally {
      t.ownerDocument.removeEventListener("focus", n, !0);
    }
    return a;
  }
  function lb(t) {
    Bm(function() {
      Bm(function(e) {
        return t(e);
      });
    });
  }
  function Fm(t, e, n) {
    switch (e = wu(n), t) {
      case "html":
        if (t = e.documentElement, !t) throw Error(r(452));
        return t;
      case "head":
        if (t = e.head, !t) throw Error(r(453));
        return t;
      case "body":
        if (t = e.body, !t) throw Error(r(454));
        return t;
      default:
        throw Error(r(451));
    }
  }
  function Wm(t, e, n) {
    for (var a in n) {
      var u = n[a];
      n.hasOwnProperty(a) && u != null && jt(t, e, a, null, Dx, u);
    }
    n.dangerouslySetInnerHTML != null && (t.textContent = ""), t.onclick === Nn && (t.onclick = null), Da(t);
  }
  function Pf(t) {
    for (var e = t.attributes; e.length; )
      t.removeAttributeNode(e[0]);
    Da(t);
  }
  var un = /* @__PURE__ */ new Map(), Pm = /* @__PURE__ */ new Set();
  function Nu(t) {
    if (typeof t.getRootNode == "function") {
      var e = t.getRootNode();
      if (e.nodeType === 9 || e.nodeType === 11) return e;
    }
    return t.nodeType === 9 ? t : t.ownerDocument;
  }
  var nl = rt.d;
  rt.d = {
    f: ab,
    r: ib,
    D: ub,
    C: ob,
    L: cb,
    m: rb,
    X: fb,
    S: sb,
    M: db
  };
  function ab() {
    var t = nl.f(), e = xc();
    return t || e;
  }
  function ib(t) {
    var e = cl(t);
    e !== null && e.tag === 5 && e.type === "form" ? eg(e) : nl.r(t);
  }
  var di = typeof document > "u" ? null : document;
  function ty(t, e, n) {
    var a = di;
    if (a && typeof e == "string" && e) {
      var u = Fe(e);
      u = 'link[rel="' + t + '"][href="' + u + '"]', typeof n == "string" && (u += '[crossorigin="' + n + '"]'), Pm.has(u) || (Pm.add(u), t = { rel: t, crossOrigin: n, href: e }, a.querySelector(u) === null && (e = a.createElement("link"), pe(e, "link", t), ee(e), a.head.appendChild(e)));
    }
  }
  function ub(t) {
    nl.D(t), ty("dns-prefetch", t, null);
  }
  function ob(t, e) {
    nl.C(t, e), ty("preconnect", t, e);
  }
  function cb(t, e, n) {
    nl.L(t, e, n);
    var a = di;
    if (a && t && e) {
      var u = 'link[rel="preload"][as="' + Fe(e) + '"]';
      e === "image" && n && n.imageSrcSet ? (u += '[imagesrcset="' + Fe(
        n.imageSrcSet
      ) + '"]', typeof n.imageSizes == "string" && (u += '[imagesizes="' + Fe(
        n.imageSizes
      ) + '"]')) : u += '[href="' + Fe(t) + '"]';
      var c = u;
      switch (e) {
        case "style":
          c = hi(t);
          break;
        case "script":
          c = gi(t);
      }
      if (!(un.has(c) || (t = R(
        {
          rel: "preload",
          href: e === "image" && n && n.imageSrcSet ? void 0 : t,
          as: e
        },
        n
      ), un.set(c, t), a.querySelector(u) !== null || e === "style" && a.querySelector(Tu(c)) || e === "script" && a.querySelector(Mu(c))))) {
        var h = a.createElement("link");
        pe(h, "link", t), e === "style" && (h[Oa] = !0, h.onload = h.onerror = function() {
          ji(h);
        }), ee(h), a.head.appendChild(h);
      }
    }
  }
  function rb(t, e) {
    nl.m(t, e);
    var n = di;
    if (n && t) {
      var a = e && typeof e.as == "string" ? e.as : "script", u = 'link[rel="modulepreload"][as="' + Fe(a) + '"][href="' + Fe(t) + '"]', c = u;
      switch (a) {
        case "audioworklet":
        case "paintworklet":
        case "serviceworker":
        case "sharedworker":
        case "worker":
        case "script":
          c = gi(t);
      }
      if (!un.has(c) && (t = R({ rel: "modulepreload", href: t }, e), un.set(c, t), n.querySelector(u) === null)) {
        switch (a) {
          case "audioworklet":
          case "paintworklet":
          case "serviceworker":
          case "sharedworker":
          case "worker":
          case "script":
            if (n.querySelector(Mu(c)))
              return;
        }
        a = n.createElement("link"), pe(a, "link", t), ee(a), n.head.appendChild(a);
      }
    }
  }
  function sb(t, e, n) {
    nl.S(t, e, n);
    var a = di;
    if (a && t) {
      var u = jn(a).hoistableStyles, c = hi(t);
      e = e || "default";
      var h = u.get(c);
      if (!h) {
        var x = { loading: 0, preload: null };
        if (h = a.querySelector(
          Tu(c)
        ))
          x.loading = 5;
        else {
          t = R(
            { rel: "stylesheet", href: t, "data-precedence": e },
            n
          ), (n = un.get(c)) && td(t, n);
          var z = h = a.createElement("link");
          ee(z), pe(z, "link", t), z._p = new Promise(function(q, $) {
            z.onload = q, z.onerror = $;
          }), z.addEventListener("load", function() {
            x.loading |= 1;
          }), z.addEventListener("error", function() {
            x.loading |= 2;
          }), x.loading |= 4, Mc(h, e, a);
        }
        h = {
          type: "stylesheet",
          instance: h,
          count: 1,
          state: x
        }, u.set(c, h);
      }
    }
  }
  function fb(t, e) {
    nl.X(t, e);
    var n = di;
    if (n && t) {
      var a = jn(n).hoistableScripts, u = gi(t), c = a.get(u);
      c || (c = n.querySelector(Mu(u)), c || (t = R({ src: t, async: !0 }, e), (e = un.get(u)) && ed(t, e), c = n.createElement("script"), ee(c), pe(c, "link", t), n.head.appendChild(c)), c = {
        type: "script",
        instance: c,
        count: 1,
        state: null
      }, a.set(u, c));
    }
  }
  function db(t, e) {
    nl.M(t, e);
    var n = di;
    if (n && t) {
      var a = jn(n).hoistableScripts, u = gi(t), c = a.get(u);
      c || (c = n.querySelector(Mu(u)), c || (t = R({ src: t, async: !0, type: "module" }, e), (e = un.get(u)) && ed(t, e), c = n.createElement("script"), ee(c), pe(c, "link", t), n.head.appendChild(c)), c = {
        type: "script",
        instance: c,
        count: 1,
        state: null
      }, a.set(u, c));
    }
  }
  function ey(t, e, n, a) {
    var u = (u = re.current) ? Nu(u) : null;
    if (!u) throw Error(r(446));
    switch (t) {
      case "meta":
      case "title":
        return null;
      case "style":
        return typeof n.precedence == "string" && typeof n.href == "string" ? (n = hi(n.href), e = jn(
          u
        ).hoistableStyles, a = e.get(n), a || (a = {
          type: "style",
          instance: null,
          count: 0,
          state: null
        }, e.set(n, a)), a) : { type: "void", instance: null, count: 0, state: null };
      case "link":
        if (n.rel === "stylesheet" && typeof n.href == "string" && typeof n.precedence == "string") {
          t = hi(n.href);
          var c = jn(
            u
          ).hoistableStyles, h = c.get(t);
          if (h || (u = u.ownerDocument || u, h = {
            type: "stylesheet",
            instance: null,
            count: 0,
            state: { loading: 0, preload: null }
          }, c.set(t, h), (c = u.querySelector(
            Tu(t)
          )) ? c._p || (h.instance = c, h.state.loading = 5) : (c = un.get(t), c || (c = {
            rel: "preload",
            as: "style",
            href: n.href,
            crossOrigin: n.crossOrigin,
            integrity: n.integrity,
            media: n.media,
            hrefLang: n.hrefLang,
            referrerPolicy: n.referrerPolicy
          }, un.set(t, c)), hb(
            u,
            t,
            c,
            h.state
          ))), e && a === null)
            throw Error(r(528, ""));
          return h;
        }
        if (e && a !== null)
          throw Error(r(529, ""));
        return null;
      case "script":
        return e = n.async, n = n.src, typeof n == "string" && e && typeof e != "function" && typeof e != "symbol" ? (n = gi(n), e = jn(
          u
        ).hoistableScripts, a = e.get(n), a || (a = {
          type: "script",
          instance: null,
          count: 0,
          state: null
        }, e.set(n, a)), a) : { type: "void", instance: null, count: 0, state: null };
      default:
        throw Error(r(444, t));
    }
  }
  function hi(t) {
    return 'href="' + Fe(t) + '"';
  }
  function Tu(t) {
    return 'link[rel="stylesheet"][' + t + "]";
  }
  function ny(t) {
    return R({}, t, {
      "data-precedence": t.precedence,
      precedence: null
    });
  }
  function hb(t, e, n, a) {
    if (e = t.querySelector(
      'link[rel="preload"][as="style"][' + e + "]"
    )) {
      if (e[Oa] !== !0) {
        a.loading = 1;
        return;
      }
    } else
      e = t.createElement("link"), e[Oa] = !0, e.onload = e.onerror = ji.bind(null, e), pe(e, "link", n), ee(e), t.head.appendChild(e);
    a.preload = e, e.addEventListener("load", function() {
      return a.loading |= 1;
    }), e.addEventListener("error", function() {
      return a.loading |= 2;
    });
  }
  function gi(t) {
    return '[src="' + Fe(t) + '"]';
  }
  function Mu(t) {
    return "script[async]" + t;
  }
  function ly(t, e, n) {
    if (e.count++, e.instance === null)
      switch (e.type) {
        case "style":
          var a = t.querySelector(
            'style[data-href~="' + Fe(n.href) + '"]'
          );
          if (a)
            return e.instance = a, ee(a), a;
          var u = R({}, n, {
            "data-href": n.href,
            "data-precedence": n.precedence,
            href: null,
            precedence: null
          });
          return a = (t.ownerDocument || t).createElement(
            "style"
          ), ee(a), pe(a, "style", u), Mc(a, n.precedence, t), e.instance = a;
        case "stylesheet":
          u = hi(n.href);
          var c = t.querySelector(
            Tu(u)
          );
          if (c)
            return e.state.loading |= 4, e.instance = c, ee(c), c;
          a = ny(n), (u = un.get(u)) && td(a, u), c = (t.ownerDocument || t).createElement("link"), ee(c);
          var h = c;
          return h._p = new Promise(function(x, z) {
            h.onload = x, h.onerror = z;
          }), pe(c, "link", a), e.state.loading |= 4, Mc(c, n.precedence, t), e.instance = c;
        case "script":
          return c = gi(n.src), (u = t.querySelector(
            Mu(c)
          )) ? (e.instance = u, ee(u), u) : (a = n, (u = un.get(c)) && (a = R({}, n), ed(a, u)), t = t.ownerDocument || t, u = t.createElement("script"), ee(u), pe(u, "link", a), t.head.appendChild(u), e.instance = u);
        case "void":
          return null;
        default:
          throw Error(r(443, e.type));
      }
    else
      e.type === "stylesheet" && (e.state.loading & 4) === 0 && (a = e.instance, e.state.loading |= 4, Mc(a, n.precedence, t));
    return e.instance;
  }
  function Mc(t, e, n) {
    for (var a = n.querySelectorAll(
      'link[rel="stylesheet"][data-precedence],style[data-precedence]'
    ), u = a.length ? a[a.length - 1] : null, c = u, h = 0; h < a.length; h++) {
      var x = a[h];
      if (x.dataset.precedence === e) c = x;
      else if (c !== u) break;
    }
    c ? c.parentNode.insertBefore(t, c.nextSibling) : (e = n.nodeType === 9 ? n.head : n, e.insertBefore(t, e.firstChild));
  }
  function td(t, e) {
    t.crossOrigin == null && (t.crossOrigin = e.crossOrigin), t.referrerPolicy == null && (t.referrerPolicy = e.referrerPolicy), t.title == null && (t.title = e.title);
  }
  function ed(t, e) {
    t.crossOrigin == null && (t.crossOrigin = e.crossOrigin), t.referrerPolicy == null && (t.referrerPolicy = e.referrerPolicy), t.integrity == null && (t.integrity = e.integrity);
  }
  var zc = null;
  function ay(t, e, n) {
    if (zc === null) {
      var a = /* @__PURE__ */ new Map(), u = zc = /* @__PURE__ */ new Map();
      u.set(n, a);
    } else
      u = zc, a = u.get(n), a || (a = /* @__PURE__ */ new Map(), u.set(n, a));
    if (a.has(t)) return a;
    for (a.set(t, null), n = n.getElementsByTagName(t), u = 0; u < n.length; u++) {
      var c = n[u];
      if (!(c[Kl] || c[oe] || t === "link" && c.getAttribute("rel") === "stylesheet") && c.namespaceURI !== "http://www.w3.org/2000/svg") {
        var h = c.getAttribute(e) || "";
        h = t + h;
        var x = a.get(h);
        x ? x.push(c) : a.set(h, [c]);
      }
    }
    return a;
  }
  function nd(t, e, n) {
    t = t.ownerDocument || t, t.head.insertBefore(
      n,
      e === "title" ? t.querySelector("head > title") : null
    );
  }
  function gb(t, e, n) {
    if (n === 1 || e.itemProp != null) return !1;
    switch (t) {
      case "meta":
      case "title":
        return !0;
      case "style":
        if (typeof e.precedence != "string" || typeof e.href != "string" || e.href === "")
          break;
        return !0;
      case "link":
        if (typeof e.rel != "string" || typeof e.href != "string" || e.href === "" || e.onLoad || e.onError)
          break;
        return e.rel === "stylesheet" ? (t = e.disabled, typeof e.precedence == "string" && t == null) : !0;
      case "script":
        if (e.async && typeof e.async != "function" && typeof e.async != "symbol" && !e.onLoad && !e.onError && e.src && typeof e.src == "string")
          return !0;
    }
    return !1;
  }
  function iy(t, e) {
    return t === "img" && e.src != null && e.src !== "" && e.onLoad == null && e.loading !== "lazy";
  }
  function uy(t) {
    return !(t.type === "stylesheet" && (t.state.loading & 3) === 0);
  }
  function oy(t) {
    return (t.width || 100) * (t.height || 100) * (typeof devicePixelRatio == "number" ? devicePixelRatio : 1) * 0.25;
  }
  function cy(t, e) {
    typeof e.decode == "function" && (t.imgCount++, e.complete || (t.imgBytes += oy(e), t.suspenseyImages.push(e)), t = vb.bind(t), e.decode().then(t, t));
  }
  function mb(t, e, n, a) {
    if (n.type === "stylesheet" && (typeof a.media != "string" || matchMedia(a.media).matches !== !1) && (n.state.loading & 4) === 0) {
      if (n.instance === null) {
        var u = hi(a.href), c = e.querySelector(
          Tu(u)
        );
        if (c) {
          e = c._p, e !== null && typeof e == "object" && typeof e.then == "function" && (t.count++, t = zu.bind(t), e.then(t, t)), n.state.loading |= 4, n.instance = c, ee(c);
          return;
        }
        c = e.ownerDocument || e, a = ny(a), (u = un.get(u)) && td(a, u), c = c.createElement("link"), ee(c);
        var h = c;
        h._p = new Promise(function(x, z) {
          h.onload = x, h.onerror = z;
        }), pe(c, "link", a), n.instance = c;
      }
      t.stylesheets === null && (t.stylesheets = /* @__PURE__ */ new Map()), t.stylesheets.set(n, e), (e = n.state.preload) && (n.state.loading & 3) === 0 && (t.count++, n = zu.bind(t), e.addEventListener("load", n), e.addEventListener("error", n));
    }
  }
  var Cc = 0;
  function yb(t, e) {
    return t.stylesheets && t.count === 0 && Oc(t, t.stylesheets), 0 < t.count || 0 < t.imgCount ? function(n) {
      var a = setTimeout(function() {
        if (t.stylesheets && Oc(t, t.stylesheets), t.unsuspend) {
          var c = t.unsuspend;
          t.unsuspend = null, c();
        }
      }, 6e4 + e);
      0 < t.imgBytes && Cc === 0 && (Cc = 62500 * Hx());
      var u = setTimeout(
        function() {
          if (t.waitingForImages = !1, t.count === 0 && (t.stylesheets && Oc(t, t.stylesheets), t.unsuspend)) {
            var c = t.unsuspend;
            t.unsuspend = null, c();
          }
        },
        (t.imgBytes > Cc ? 50 : 800) + e
      );
      return t.unsuspend = n, function() {
        t.unsuspend = null, clearTimeout(a), clearTimeout(u);
      };
    } : null;
  }
  function ry(t) {
    if (t.count === 0 && (t.imgCount === 0 || !t.waitingForImages)) {
      if (t.stylesheets) Oc(t, t.stylesheets);
      else if (t.unsuspend) {
        var e = t.unsuspend;
        t.unsuspend = null, e();
      }
    }
  }
  function zu() {
    this.count--, ry(this);
  }
  function vb() {
    this.imgCount--, ry(this);
  }
  var Ac = null;
  function Oc(t, e) {
    t.stylesheets = null, t.unsuspend !== null && (t.count++, Ac = /* @__PURE__ */ new Map(), e.forEach(pb, t), Ac = null, zu.call(t));
  }
  function pb(t, e) {
    if (!(e.state.loading & 4)) {
      var n = Ac.get(t);
      if (n) var a = n.get(null);
      else {
        n = /* @__PURE__ */ new Map(), Ac.set(t, n);
        for (var u = t.querySelectorAll(
          "link[data-precedence],style[data-precedence]"
        ), c = 0; c < u.length; c++) {
          var h = u[c];
          (h.nodeName === "LINK" || h.getAttribute("media") !== "not all") && (n.set(h.dataset.precedence, h), a = h);
        }
        a && n.set(null, a);
      }
      u = e.instance, h = u.getAttribute("data-precedence"), c = n.get(h) || a, c === a && n.set(null, u), n.set(h, u), this.count++, a = zu.bind(this), u.addEventListener("load", a), u.addEventListener("error", a), c ? c.parentNode.insertBefore(u, c.nextSibling) : (t = t.nodeType === 9 ? t.head : t, t.insertBefore(u, t.firstChild)), e.state.loading |= 4;
    }
  }
  var mi = {
    $$typeof: V,
    Provider: null,
    Consumer: null,
    _currentValue: vt,
    _currentValue2: vt,
    _threadCount: 0
  };
  function Sb(t, e, n, a, u, c, h, x, z) {
    this.tag = 1, this.containerInfo = t, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = qi(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = qi(0), this.hiddenUpdates = qi(null), this.identifierPrefix = a, this.onUncaughtError = u, this.onCaughtError = c, this.onRecoverableError = h, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = z, this.transitionTypes = null, this.incompleteTransitions = /* @__PURE__ */ new Map();
  }
  function sy(t, e, n, a, u, c, h, x, z, q, $, nt) {
    return t = new Sb(
      t,
      e,
      n,
      h,
      z,
      q,
      $,
      nt,
      x
    ), e = 1, c === !0 && (e |= 24), c = Re(3, null, null, e), t.current = c, c.stateNode = t, e = ys(), e.refCount++, t.pooledCache = e, e.refCount++, c.memoizedState = {
      element: a,
      isDehydrated: n,
      cache: e
    }, xs(c), t;
  }
  function fy(t) {
    return t ? (t = Xa, t) : Xa;
  }
  function dy(t, e, n, a, u, c) {
    u = fy(u), a.context === null ? a.context = u : a.pendingContext = u, a = pl(e), a.payload = { element: n }, c = c === void 0 ? null : c, c !== null && (a.callback = c), n = Sl(t, a, e), n !== null && (Ye(n, t, e), iu(n, t, e));
  }
  function hy(t, e) {
    if (t = t.memoizedState, t !== null && t.dehydrated !== null) {
      var n = t.retryLane;
      t.retryLane = n !== 0 && n < e ? n : e;
    }
  }
  function ld(t, e) {
    hy(t, e), (t = t.alternate) && hy(t, e);
  }
  function gy(t) {
    if (t.tag === 13 || t.tag === 31) {
      var e = kl(t, 67108864);
      e !== null && Ye(e, t, 67108864), ld(t, 67108864);
    }
  }
  function my(t) {
    if (t.tag === 13 || t.tag === 31) {
      var e = Qe();
      e = Aa(e);
      var n = kl(t, e);
      n !== null && Ye(n, t, e), ld(t, e);
    }
  }
  var yi = !0;
  function xb(t, e, n, a) {
    var u = ct.T;
    ct.T = null;
    var c = rt.p;
    try {
      rt.p = 2, ad(t, e, n, a);
    } finally {
      rt.p = c, ct.T = u;
    }
  }
  function bb(t, e, n, a) {
    var u = ct.T;
    ct.T = null;
    var c = rt.p;
    try {
      rt.p = 8, ad(t, e, n, a);
    } finally {
      rt.p = c, ct.T = u;
    }
  }
  function ad(t, e, n, a) {
    if (yi) {
      var u = id(a);
      if (u === null)
        Lf(
          t,
          e,
          a,
          Dc,
          n
        ), vy(t, a);
      else if (_b(
        u,
        t,
        e,
        n,
        a
      ))
        a.stopPropagation();
      else if (vy(t, a), e & 4 && -1 < Eb.indexOf(t)) {
        for (; u !== null; ) {
          var c = cl(u);
          if (c !== null)
            switch (c.tag) {
              case 3:
                if (c = c.stateNode, c.current.memoizedState.isDehydrated) {
                  var h = qn(c.pendingLanes);
                  if (h !== 0) {
                    var x = c;
                    for (x.pendingLanes |= 2, x.entangledLanes |= 2; h; ) {
                      var z = 1 << 31 - Te(h);
                      x.entanglements[1] |= z, h &= ~z;
                    }
                    Un(c), (Vt & 6) === 0 && (vc = we() + 500, bu(0));
                  }
                }
                break;
              case 31:
              case 13:
                x = kl(c, 2), x !== null && Ye(x, c, 2), xc(), ld(c, 2);
            }
          if (c = id(a), c === null && Lf(
            t,
            e,
            a,
            Dc,
            n
          ), c === u) break;
          u = c;
        }
        u !== null && a.stopPropagation();
      } else
        Lf(
          t,
          e,
          a,
          null,
          n
        );
    }
  }
  function id(t) {
    return t = Zr(t), ud(t);
  }
  var Dc = null;
  function ud(t) {
    if (Dc = null, t = Xn(t), t !== null) {
      var e = f(t);
      if (e === null) t = null;
      else {
        var n = e.tag;
        if (n === 13) {
          if (t = d(e), t !== null) return t;
          t = null;
        } else if (n === 31) {
          if (t = g(e), t !== null) return t;
          t = null;
        } else if (n === 3) {
          if (e.stateNode.current.memoizedState.isDehydrated)
            return e.tag === 3 ? e.stateNode.containerInfo : null;
          t = null;
        } else e !== t && (t = null);
      }
    }
    return Dc = t, null;
  }
  function yy(t) {
    switch (t) {
      case "beforetoggle":
      case "cancel":
      case "click":
      case "close":
      case "contextmenu":
      case "copy":
      case "cut":
      case "auxclick":
      case "dblclick":
      case "dragend":
      case "dragstart":
      case "drop":
      case "focusin":
      case "focusout":
      case "input":
      case "invalid":
      case "keydown":
      case "keypress":
      case "keyup":
      case "mousedown":
      case "mouseup":
      case "paste":
      case "pause":
      case "play":
      case "pointercancel":
      case "pointerdown":
      case "pointerup":
      case "ratechange":
      case "reset":
      case "seeked":
      case "submit":
      case "toggle":
      case "touchcancel":
      case "touchend":
      case "touchstart":
      case "volumechange":
      case "change":
      case "selectionchange":
      case "textInput":
      case "compositionstart":
      case "compositionend":
      case "compositionupdate":
      case "beforeblur":
      case "afterblur":
      case "beforeinput":
      case "blur":
      case "fullscreenchange":
      case "fullscreenerror":
      case "focus":
      case "hashchange":
      case "popstate":
      case "select":
      case "selectstart":
        return 2;
      case "drag":
      case "dragenter":
      case "dragexit":
      case "dragleave":
      case "dragover":
      case "mousemove":
      case "mouseout":
      case "mouseover":
      case "pointermove":
      case "pointerout":
      case "pointerover":
      case "resize":
      case "scroll":
      case "touchmove":
      case "wheel":
      case "mouseenter":
      case "mouseleave":
      case "pointerenter":
      case "pointerleave":
        return 8;
      case "message":
        switch (zr()) {
          case lo:
            return 2;
          case ao:
            return 8;
          case Na:
          case Cr:
            return 32;
          case io:
            return 268435456;
          default:
            return 32;
        }
      default:
        return 32;
    }
  }
  var od = !1, Ol = null, Dl = null, Rl = null, Cu = /* @__PURE__ */ new Map(), Au = /* @__PURE__ */ new Map(), Hl = [], Eb = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(
    " "
  );
  function vy(t, e) {
    switch (t) {
      case "focusin":
      case "focusout":
        Ol = null;
        break;
      case "dragenter":
      case "dragleave":
        Dl = null;
        break;
      case "mouseover":
      case "mouseout":
        Rl = null;
        break;
      case "pointerover":
      case "pointerout":
        Cu.delete(e.pointerId);
        break;
      case "gotpointercapture":
      case "lostpointercapture":
        Au.delete(e.pointerId);
    }
  }
  function Ou(t, e, n, a, u, c) {
    return t === null || t.nativeEvent !== c ? (t = {
      blockedOn: e,
      domEventName: n,
      eventSystemFlags: a,
      nativeEvent: c,
      targetContainers: [u]
    }, e !== null && (e = cl(e), e !== null && gy(e)), t) : (t.eventSystemFlags |= a, e = t.targetContainers, u !== null && e.indexOf(u) === -1 && e.push(u), t);
  }
  function _b(t, e, n, a, u) {
    switch (e) {
      case "focusin":
        return Ol = Ou(
          Ol,
          t,
          e,
          n,
          a,
          u
        ), !0;
      case "dragenter":
        return Dl = Ou(
          Dl,
          t,
          e,
          n,
          a,
          u
        ), !0;
      case "mouseover":
        return Rl = Ou(
          Rl,
          t,
          e,
          n,
          a,
          u
        ), !0;
      case "pointerover":
        var c = u.pointerId;
        return Cu.set(
          c,
          Ou(
            Cu.get(c) || null,
            t,
            e,
            n,
            a,
            u
          )
        ), !0;
      case "gotpointercapture":
        return c = u.pointerId, Au.set(
          c,
          Ou(
            Au.get(c) || null,
            t,
            e,
            n,
            a,
            u
          )
        ), !0;
    }
    return !1;
  }
  function py(t) {
    var e = Xn(t.target);
    if (e !== null) {
      var n = f(e);
      if (n !== null) {
        if (e = n.tag, e === 13) {
          if (e = d(n), e !== null) {
            t.blockedOn = e, fo(t.priority, function() {
              my(n);
            });
            return;
          }
        } else if (e === 31) {
          if (e = g(n), e !== null) {
            t.blockedOn = e, fo(t.priority, function() {
              my(n);
            });
            return;
          }
        } else if (e === 3 && n.stateNode.current.memoizedState.isDehydrated) {
          t.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
          return;
        }
      }
    }
    t.blockedOn = null;
  }
  function Rc(t) {
    if (t.blockedOn !== null) return !1;
    for (var e = t.targetContainers; 0 < e.length; ) {
      var n = id(t.nativeEvent);
      if (n === null) {
        n = t.nativeEvent;
        var a = new n.constructor(
          n.type,
          n
        );
        jr = a, n.target.dispatchEvent(a), jr = null;
      } else
        return e = cl(n), e !== null && gy(e), t.blockedOn = n, !1;
      e.shift();
    }
    return !0;
  }
  function Sy(t, e, n) {
    Rc(t) && n.delete(e);
  }
  function wb() {
    od = !1, Ol !== null && Rc(Ol) && (Ol = null), Dl !== null && Rc(Dl) && (Dl = null), Rl !== null && Rc(Rl) && (Rl = null), Cu.forEach(Sy), Au.forEach(Sy);
  }
  function Hc(t, e) {
    t.blockedOn === e && (t.blockedOn = null, od || (od = !0, l.unstable_scheduleCallback(
      l.unstable_NormalPriority,
      wb
    )));
  }
  var Uc = null;
  function xy(t) {
    Uc !== t && (Uc = t, l.unstable_scheduleCallback(
      l.unstable_NormalPriority,
      function() {
        Uc === t && (Uc = null);
        for (var e = 0; e < t.length; e += 3) {
          var n = t[e], a = t[e + 1], u = t[e + 2];
          if (typeof a != "function") {
            if (ud(a || n) === null)
              continue;
            break;
          }
          var c = cl(n);
          c !== null && (t.splice(e, 3), e -= 3, Xs(
            c,
            {
              pending: !0,
              data: u,
              method: n.method,
              action: a
            },
            a,
            u
          ));
        }
      }
    ));
  }
  function vi(t) {
    function e(z) {
      return Hc(z, t);
    }
    Ol !== null && Hc(Ol, t), Dl !== null && Hc(Dl, t), Rl !== null && Hc(Rl, t), Cu.forEach(e), Au.forEach(e);
    for (var n = 0; n < Hl.length; n++) {
      var a = Hl[n];
      a.blockedOn === t && (a.blockedOn = null);
    }
    for (; 0 < Hl.length && (n = Hl[0], n.blockedOn === null); )
      py(n), n.blockedOn === null && Hl.shift();
    if (n = (t.ownerDocument || t).$$reactFormReplay, n != null)
      for (a = 0; a < n.length; a += 3) {
        var u = n[a], c = n[a + 1], h = u[be] || null;
        if (typeof c == "function")
          h || xy(n);
        else if (h) {
          var x = null;
          if (c && c.hasAttribute("formAction")) {
            if (u = c, h = c[be] || null)
              x = h.formAction;
            else if (ud(u) !== null) continue;
          } else x = h.action;
          typeof x == "function" ? n[a + 1] = x : (n.splice(a, 3), a -= 3), xy(n);
        }
      }
  }
  function by() {
    function t(c) {
      c.canIntercept && c.info === "react-transition" && c.intercept({
        handler: function() {
          return new Promise(function(h) {
            return u = h;
          });
        },
        focusReset: "manual",
        scroll: "manual"
      });
    }
    function e() {
      u !== null && (u(), u = null), a || setTimeout(n, 20);
    }
    function n() {
      if (!a && !navigation.transition) {
        var c = navigation.currentEntry;
        c && c.url != null && navigation.navigate(c.url, {
          state: c.getState(),
          info: "react-transition",
          history: "replace"
        });
      }
    }
    if (typeof navigation == "object") {
      var a = !1, u = null;
      return navigation.addEventListener("navigate", t), navigation.addEventListener("navigatesuccess", e), navigation.addEventListener("navigateerror", e), setTimeout(n, 100), function() {
        a = !0, navigation.removeEventListener("navigate", t), navigation.removeEventListener("navigatesuccess", e), navigation.removeEventListener("navigateerror", e), u !== null && (u(), u = null);
      };
    }
  }
  function cd(t) {
    this._internalRoot = t;
  }
  Bc.prototype.render = cd.prototype.render = function(t) {
    var e = this._internalRoot;
    if (e === null) throw Error(r(409));
    var n = e.current, a = Qe();
    dy(n, a, t, e, null, null);
  }, Bc.prototype.unmount = cd.prototype.unmount = function() {
    var t = this._internalRoot;
    if (t !== null) {
      this._internalRoot = null;
      var e = t.containerInfo;
      dy(t.current, 2, null, t, null, null), xc(), e[ol] = null;
    }
  };
  function Bc(t) {
    this._internalRoot = t;
  }
  Bc.prototype.unstable_scheduleHydration = function(t) {
    if (t) {
      var e = so();
      t = { blockedOn: null, target: t, priority: e };
      for (var n = 0; n < Hl.length && e !== 0 && e < Hl[n].priority; n++) ;
      Hl.splice(n, 0, t), n === 0 && py(t);
    }
  };
  var Ey = i.version;
  if (Ey !== "19.3.1")
    throw Error(
      r(
        527,
        Ey,
        "19.3.1"
      )
    );
  rt.findDOMNode = function(t) {
    var e = t._reactInternals;
    if (e === void 0)
      throw typeof t.render == "function" ? Error(r(188)) : (t = Object.keys(t).join(","), Error(r(268, t)));
    return t = v(e), t = t !== null ? y(t) : null, t = t === null ? null : t.stateNode, t;
  };
  var Nb = {
    bundleType: 0,
    version: "19.3.1",
    rendererPackageName: "react-dom",
    currentDispatcherRef: ct,
    reconcilerVersion: "19.3.1"
  };
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
    var Yc = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!Yc.isDisabled && Yc.supportsFiber)
      try {
        Zl = Yc.inject(
          Nb
        ), Ne = Yc;
      } catch {
      }
  }
  return Du.createRoot = function(t, e) {
    if (!s(t)) throw Error(r(299));
    var n = !1, a = "", u = fg, c = dg, h = hg;
    return e != null && (e.unstable_strictMode === !0 && (n = !0), e.identifierPrefix !== void 0 && (a = e.identifierPrefix), e.onUncaughtError !== void 0 && (u = e.onUncaughtError), e.onCaughtError !== void 0 && (c = e.onCaughtError), e.onRecoverableError !== void 0 && (h = e.onRecoverableError)), e = sy(
      t,
      1,
      !1,
      null,
      null,
      n,
      a,
      null,
      u,
      c,
      h,
      by
    ), t[ol] = e.current, Vf(t), new cd(e);
  }, Du.hydrateRoot = function(t, e, n) {
    if (!s(t)) throw Error(r(299));
    var a = !1, u = "", c = fg, h = dg, x = hg, z = null;
    return n != null && (n.unstable_strictMode === !0 && (a = !0), n.identifierPrefix !== void 0 && (u = n.identifierPrefix), n.onUncaughtError !== void 0 && (c = n.onUncaughtError), n.onCaughtError !== void 0 && (h = n.onCaughtError), n.onRecoverableError !== void 0 && (x = n.onRecoverableError), n.formState !== void 0 && (z = n.formState)), e = sy(
      t,
      1,
      !0,
      e,
      n ?? null,
      a,
      u,
      z,
      c,
      h,
      x,
      by
    ), e.context = fy(null), n = e.current, a = Qe(), a = Aa(a), u = pl(a), u.callback = null, Sl(n, u, a), n = a, e.current.lanes = n, Ql(e, n), Un(e), t[ol] = e.current, Vf(t), new Bc(e);
  }, Du.version = "19.3.1", Du;
}
var Ay;
function Db() {
  if (Ay) return sd.exports;
  Ay = 1;
  function l() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(l);
      } catch (i) {
        console.error(i);
      }
  }
  return l(), sd.exports = Ob(), sd.exports;
}
var Rb = Db(), gd = { exports: {} }, Ru = {};
var Oy;
function Hb() {
  if (Oy) return Ru;
  Oy = 1;
  var l = /* @__PURE__ */ Symbol.for("react.transitional.element"), i = /* @__PURE__ */ Symbol.for("react.fragment");
  function o(r, s, f) {
    var d = null;
    if (f !== void 0 && (d = "" + f), s.key !== void 0 && (d = "" + s.key), "key" in s) {
      f = {};
      for (var g in s)
        g !== "key" && (f[g] = s[g]);
    } else f = s;
    return s = f.ref, {
      $$typeof: l,
      type: r,
      key: d,
      ref: s !== void 0 ? s : null,
      props: f
    };
  }
  return Ru.Fragment = i, Ru.jsx = o, Ru.jsxs = o, Ru;
}
var Dy;
function Ub() {
  return Dy || (Dy = 1, gd.exports = Hb()), gd.exports;
}
var W = Ub();
function ue(l) {
  if (typeof l == "string" || typeof l == "number") return "" + l;
  let i = "";
  if (Array.isArray(l))
    for (let o = 0, r; o < l.length; o++)
      (r = ue(l[o])) !== "" && (i += (i && " ") + r);
  else
    for (let o in l)
      l[o] && (i += (i && " ") + o);
  return i;
}
var Bb = { value: () => {
} };
function fr() {
  for (var l = 0, i = arguments.length, o = {}, r; l < i; ++l) {
    if (!(r = arguments[l] + "") || r in o || /[\s.]/.test(r)) throw new Error("illegal type: " + r);
    o[r] = [];
  }
  return new $c(o);
}
function $c(l) {
  this._ = l;
}
function Yb(l, i) {
  return l.trim().split(/^|\s+/).map(function(o) {
    var r = "", s = o.indexOf(".");
    if (s >= 0 && (r = o.slice(s + 1), o = o.slice(0, s)), o && !i.hasOwnProperty(o)) throw new Error("unknown type: " + o);
    return { type: o, name: r };
  });
}
$c.prototype = fr.prototype = {
  constructor: $c,
  on: function(l, i) {
    var o = this._, r = Yb(l + "", o), s, f = -1, d = r.length;
    if (arguments.length < 2) {
      for (; ++f < d; ) if ((s = (l = r[f]).type) && (s = Vb(o[s], l.name))) return s;
      return;
    }
    if (i != null && typeof i != "function") throw new Error("invalid callback: " + i);
    for (; ++f < d; )
      if (s = (l = r[f]).type) o[s] = Ry(o[s], l.name, i);
      else if (i == null) for (s in o) o[s] = Ry(o[s], l.name, null);
    return this;
  },
  copy: function() {
    var l = {}, i = this._;
    for (var o in i) l[o] = i[o].slice();
    return new $c(l);
  },
  call: function(l, i) {
    if ((s = arguments.length - 2) > 0) for (var o = new Array(s), r = 0, s, f; r < s; ++r) o[r] = arguments[r + 2];
    if (!this._.hasOwnProperty(l)) throw new Error("unknown type: " + l);
    for (f = this._[l], r = 0, s = f.length; r < s; ++r) f[r].value.apply(i, o);
  },
  apply: function(l, i, o) {
    if (!this._.hasOwnProperty(l)) throw new Error("unknown type: " + l);
    for (var r = this._[l], s = 0, f = r.length; s < f; ++s) r[s].value.apply(i, o);
  }
};
function Vb(l, i) {
  for (var o = 0, r = l.length, s; o < r; ++o)
    if ((s = l[o]).name === i)
      return s.value;
}
function Ry(l, i, o) {
  for (var r = 0, s = l.length; r < s; ++r)
    if (l[r].name === i) {
      l[r] = Bb, l = l.slice(0, r).concat(l.slice(r + 1));
      break;
    }
  return o != null && l.push({ name: i, value: o }), l;
}
var Dd = "http://www.w3.org/1999/xhtml", Hy = {
  svg: "http://www.w3.org/2000/svg",
  xhtml: Dd,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};
function dr(l) {
  var i = l += "", o = i.indexOf(":");
  return o >= 0 && (i = l.slice(0, o)) !== "xmlns" && (l = l.slice(o + 1)), Hy.hasOwnProperty(i) ? { space: Hy[i], local: l } : l;
}
function Lb(l) {
  return function() {
    var i = this.ownerDocument, o = this.namespaceURI;
    return o === Dd && i.documentElement.namespaceURI === Dd ? i.createElement(l) : i.createElementNS(o, l);
  };
}
function qb(l) {
  return function() {
    return this.ownerDocument.createElementNS(l.space, l.local);
  };
}
function Jv(l) {
  var i = dr(l);
  return (i.local ? qb : Lb)(i);
}
function Xb() {
}
function $d(l) {
  return l == null ? Xb : function() {
    return this.querySelector(l);
  };
}
function jb(l) {
  typeof l != "function" && (l = $d(l));
  for (var i = this._groups, o = i.length, r = new Array(o), s = 0; s < o; ++s)
    for (var f = i[s], d = f.length, g = r[s] = new Array(d), S, v, y = 0; y < d; ++y)
      (S = f[y]) && (v = l.call(S, S.__data__, y, f)) && ("__data__" in S && (v.__data__ = S.__data__), g[y] = v);
  return new Je(r, this._parents);
}
function Zb(l) {
  return l == null ? [] : Array.isArray(l) ? l : Array.from(l);
}
function Gb() {
  return [];
}
function Iv(l) {
  return l == null ? Gb : function() {
    return this.querySelectorAll(l);
  };
}
function Qb(l) {
  return function() {
    return Zb(l.apply(this, arguments));
  };
}
function Kb(l) {
  typeof l == "function" ? l = Qb(l) : l = Iv(l);
  for (var i = this._groups, o = i.length, r = [], s = [], f = 0; f < o; ++f)
    for (var d = i[f], g = d.length, S, v = 0; v < g; ++v)
      (S = d[v]) && (r.push(l.call(S, S.__data__, v, d)), s.push(S));
  return new Je(r, s);
}
function kv(l) {
  return function() {
    return this.matches(l);
  };
}
function Fv(l) {
  return function(i) {
    return i.matches(l);
  };
}
var $b = Array.prototype.find;
function Jb(l) {
  return function() {
    return $b.call(this.children, l);
  };
}
function Ib() {
  return this.firstElementChild;
}
function kb(l) {
  return this.select(l == null ? Ib : Jb(typeof l == "function" ? l : Fv(l)));
}
var Fb = Array.prototype.filter;
function Wb() {
  return Array.from(this.children);
}
function Pb(l) {
  return function() {
    return Fb.call(this.children, l);
  };
}
function tE(l) {
  return this.selectAll(l == null ? Wb : Pb(typeof l == "function" ? l : Fv(l)));
}
function eE(l) {
  typeof l != "function" && (l = kv(l));
  for (var i = this._groups, o = i.length, r = new Array(o), s = 0; s < o; ++s)
    for (var f = i[s], d = f.length, g = r[s] = [], S, v = 0; v < d; ++v)
      (S = f[v]) && l.call(S, S.__data__, v, f) && g.push(S);
  return new Je(r, this._parents);
}
function Wv(l) {
  return new Array(l.length);
}
function nE() {
  return new Je(this._enter || this._groups.map(Wv), this._parents);
}
function Wc(l, i) {
  this.ownerDocument = l.ownerDocument, this.namespaceURI = l.namespaceURI, this._next = null, this._parent = l, this.__data__ = i;
}
Wc.prototype = {
  constructor: Wc,
  appendChild: function(l) {
    return this._parent.insertBefore(l, this._next);
  },
  insertBefore: function(l, i) {
    return this._parent.insertBefore(l, i);
  },
  querySelector: function(l) {
    return this._parent.querySelector(l);
  },
  querySelectorAll: function(l) {
    return this._parent.querySelectorAll(l);
  }
};
function lE(l) {
  return function() {
    return l;
  };
}
function aE(l, i, o, r, s, f) {
  for (var d = 0, g, S = i.length, v = f.length; d < v; ++d)
    (g = i[d]) ? (g.__data__ = f[d], r[d] = g) : o[d] = new Wc(l, f[d]);
  for (; d < S; ++d)
    (g = i[d]) && (s[d] = g);
}
function iE(l, i, o, r, s, f, d) {
  var g, S, v = /* @__PURE__ */ new Map(), y = i.length, m = f.length, p = new Array(y), b;
  for (g = 0; g < y; ++g)
    (S = i[g]) && (p[g] = b = d.call(S, S.__data__, g, i) + "", v.has(b) ? s[g] = S : v.set(b, S));
  for (g = 0; g < m; ++g)
    b = d.call(l, f[g], g, f) + "", (S = v.get(b)) ? (r[g] = S, S.__data__ = f[g], v.delete(b)) : o[g] = new Wc(l, f[g]);
  for (g = 0; g < y; ++g)
    (S = i[g]) && v.get(p[g]) === S && (s[g] = S);
}
function uE(l) {
  return l.__data__;
}
function oE(l, i) {
  if (!arguments.length) return Array.from(this, uE);
  var o = i ? iE : aE, r = this._parents, s = this._groups;
  typeof l != "function" && (l = lE(l));
  for (var f = s.length, d = new Array(f), g = new Array(f), S = new Array(f), v = 0; v < f; ++v) {
    var y = r[v], m = s[v], p = m.length, b = cE(l.call(y, y && y.__data__, v, r)), E = b.length, C = g[v] = new Array(E), N = d[v] = new Array(E), w = S[v] = new Array(p);
    o(y, m, C, N, w, b, i);
    for (var U = 0, _ = 0, A, j; U < E; ++U)
      if (A = C[U]) {
        for (U >= _ && (_ = U + 1); !(j = N[_]) && ++_ < E; ) ;
        A._next = j || null;
      }
  }
  return d = new Je(d, r), d._enter = g, d._exit = S, d;
}
function cE(l) {
  return typeof l == "object" && "length" in l ? l : Array.from(l);
}
function rE() {
  return new Je(this._exit || this._groups.map(Wv), this._parents);
}
function sE(l, i, o) {
  var r = this.enter(), s = this, f = this.exit();
  return typeof l == "function" ? (r = l(r), r && (r = r.selection())) : r = r.append(l + ""), i != null && (s = i(s), s && (s = s.selection())), o == null ? f.remove() : o(f), r && s ? r.merge(s).order() : s;
}
function fE(l) {
  for (var i = l.selection ? l.selection() : l, o = this._groups, r = i._groups, s = o.length, f = r.length, d = Math.min(s, f), g = new Array(s), S = 0; S < d; ++S)
    for (var v = o[S], y = r[S], m = v.length, p = g[S] = new Array(m), b, E = 0; E < m; ++E)
      (b = v[E] || y[E]) && (p[E] = b);
  for (; S < s; ++S)
    g[S] = o[S];
  return new Je(g, this._parents);
}
function dE() {
  for (var l = this._groups, i = -1, o = l.length; ++i < o; )
    for (var r = l[i], s = r.length - 1, f = r[s], d; --s >= 0; )
      (d = r[s]) && (f && d.compareDocumentPosition(f) ^ 4 && f.parentNode.insertBefore(d, f), f = d);
  return this;
}
function hE(l) {
  l || (l = gE);
  function i(m, p) {
    return m && p ? l(m.__data__, p.__data__) : !m - !p;
  }
  for (var o = this._groups, r = o.length, s = new Array(r), f = 0; f < r; ++f) {
    for (var d = o[f], g = d.length, S = s[f] = new Array(g), v, y = 0; y < g; ++y)
      (v = d[y]) && (S[y] = v);
    S.sort(i);
  }
  return new Je(s, this._parents).order();
}
function gE(l, i) {
  return l < i ? -1 : l > i ? 1 : l >= i ? 0 : NaN;
}
function mE() {
  var l = arguments[0];
  return arguments[0] = this, l.apply(null, arguments), this;
}
function yE() {
  return Array.from(this);
}
function vE() {
  for (var l = this._groups, i = 0, o = l.length; i < o; ++i)
    for (var r = l[i], s = 0, f = r.length; s < f; ++s) {
      var d = r[s];
      if (d) return d;
    }
  return null;
}
function pE() {
  let l = 0;
  for (const i of this) ++l;
  return l;
}
function SE() {
  return !this.node();
}
function xE(l) {
  for (var i = this._groups, o = 0, r = i.length; o < r; ++o)
    for (var s = i[o], f = 0, d = s.length, g; f < d; ++f)
      (g = s[f]) && l.call(g, g.__data__, f, s);
  return this;
}
function bE(l) {
  return function() {
    this.removeAttribute(l);
  };
}
function EE(l) {
  return function() {
    this.removeAttributeNS(l.space, l.local);
  };
}
function _E(l, i) {
  return function() {
    this.setAttribute(l, i);
  };
}
function wE(l, i) {
  return function() {
    this.setAttributeNS(l.space, l.local, i);
  };
}
function NE(l, i) {
  return function() {
    var o = i.apply(this, arguments);
    o == null ? this.removeAttribute(l) : this.setAttribute(l, o);
  };
}
function TE(l, i) {
  return function() {
    var o = i.apply(this, arguments);
    o == null ? this.removeAttributeNS(l.space, l.local) : this.setAttributeNS(l.space, l.local, o);
  };
}
function ME(l, i) {
  var o = dr(l);
  if (arguments.length < 2) {
    var r = this.node();
    return o.local ? r.getAttributeNS(o.space, o.local) : r.getAttribute(o);
  }
  return this.each((i == null ? o.local ? EE : bE : typeof i == "function" ? o.local ? TE : NE : o.local ? wE : _E)(o, i));
}
function Pv(l) {
  return l.ownerDocument && l.ownerDocument.defaultView || l.document && l || l.defaultView;
}
function zE(l) {
  return function() {
    this.style.removeProperty(l);
  };
}
function CE(l, i, o) {
  return function() {
    this.style.setProperty(l, i, o);
  };
}
function AE(l, i, o) {
  return function() {
    var r = i.apply(this, arguments);
    r == null ? this.style.removeProperty(l) : this.style.setProperty(l, r, o);
  };
}
function OE(l, i, o) {
  return arguments.length > 1 ? this.each((i == null ? zE : typeof i == "function" ? AE : CE)(l, i, o ?? "")) : Ni(this.node(), l);
}
function Ni(l, i) {
  return l.style.getPropertyValue(i) || Pv(l).getComputedStyle(l, null).getPropertyValue(i);
}
function DE(l) {
  return function() {
    delete this[l];
  };
}
function RE(l, i) {
  return function() {
    this[l] = i;
  };
}
function HE(l, i) {
  return function() {
    var o = i.apply(this, arguments);
    o == null ? delete this[l] : this[l] = o;
  };
}
function UE(l, i) {
  return arguments.length > 1 ? this.each((i == null ? DE : typeof i == "function" ? HE : RE)(l, i)) : this.node()[l];
}
function tp(l) {
  return l.trim().split(/^|\s+/);
}
function Jd(l) {
  return l.classList || new ep(l);
}
function ep(l) {
  this._node = l, this._names = tp(l.getAttribute("class") || "");
}
ep.prototype = {
  add: function(l) {
    var i = this._names.indexOf(l);
    i < 0 && (this._names.push(l), this._node.setAttribute("class", this._names.join(" ")));
  },
  remove: function(l) {
    var i = this._names.indexOf(l);
    i >= 0 && (this._names.splice(i, 1), this._node.setAttribute("class", this._names.join(" ")));
  },
  contains: function(l) {
    return this._names.indexOf(l) >= 0;
  }
};
function np(l, i) {
  for (var o = Jd(l), r = -1, s = i.length; ++r < s; ) o.add(i[r]);
}
function lp(l, i) {
  for (var o = Jd(l), r = -1, s = i.length; ++r < s; ) o.remove(i[r]);
}
function BE(l) {
  return function() {
    np(this, l);
  };
}
function YE(l) {
  return function() {
    lp(this, l);
  };
}
function VE(l, i) {
  return function() {
    (i.apply(this, arguments) ? np : lp)(this, l);
  };
}
function LE(l, i) {
  var o = tp(l + "");
  if (arguments.length < 2) {
    for (var r = Jd(this.node()), s = -1, f = o.length; ++s < f; ) if (!r.contains(o[s])) return !1;
    return !0;
  }
  return this.each((typeof i == "function" ? VE : i ? BE : YE)(o, i));
}
function qE() {
  this.textContent = "";
}
function XE(l) {
  return function() {
    this.textContent = l;
  };
}
function jE(l) {
  return function() {
    var i = l.apply(this, arguments);
    this.textContent = i ?? "";
  };
}
function ZE(l) {
  return arguments.length ? this.each(l == null ? qE : (typeof l == "function" ? jE : XE)(l)) : this.node().textContent;
}
function GE() {
  this.innerHTML = "";
}
function QE(l) {
  return function() {
    this.innerHTML = l;
  };
}
function KE(l) {
  return function() {
    var i = l.apply(this, arguments);
    this.innerHTML = i ?? "";
  };
}
function $E(l) {
  return arguments.length ? this.each(l == null ? GE : (typeof l == "function" ? KE : QE)(l)) : this.node().innerHTML;
}
function JE() {
  this.nextSibling && this.parentNode.appendChild(this);
}
function IE() {
  return this.each(JE);
}
function kE() {
  this.previousSibling && this.parentNode.insertBefore(this, this.parentNode.firstChild);
}
function FE() {
  return this.each(kE);
}
function WE(l) {
  var i = typeof l == "function" ? l : Jv(l);
  return this.select(function() {
    return this.appendChild(i.apply(this, arguments));
  });
}
function PE() {
  return null;
}
function t2(l, i) {
  var o = typeof l == "function" ? l : Jv(l), r = i == null ? PE : typeof i == "function" ? i : $d(i);
  return this.select(function() {
    return this.insertBefore(o.apply(this, arguments), r.apply(this, arguments) || null);
  });
}
function e2() {
  var l = this.parentNode;
  l && l.removeChild(this);
}
function n2() {
  return this.each(e2);
}
function l2() {
  var l = this.cloneNode(!1), i = this.parentNode;
  return i ? i.insertBefore(l, this.nextSibling) : l;
}
function a2() {
  var l = this.cloneNode(!0), i = this.parentNode;
  return i ? i.insertBefore(l, this.nextSibling) : l;
}
function i2(l) {
  return this.select(l ? a2 : l2);
}
function u2(l) {
  return arguments.length ? this.property("__data__", l) : this.node().__data__;
}
function o2(l) {
  return function(i) {
    l.call(this, i, this.__data__);
  };
}
function c2(l) {
  return l.trim().split(/^|\s+/).map(function(i) {
    var o = "", r = i.indexOf(".");
    return r >= 0 && (o = i.slice(r + 1), i = i.slice(0, r)), { type: i, name: o };
  });
}
function r2(l) {
  return function() {
    var i = this.__on;
    if (i) {
      for (var o = 0, r = -1, s = i.length, f; o < s; ++o)
        f = i[o], (!l.type || f.type === l.type) && f.name === l.name ? this.removeEventListener(f.type, f.listener, f.options) : i[++r] = f;
      ++r ? i.length = r : delete this.__on;
    }
  };
}
function s2(l, i, o) {
  return function() {
    var r = this.__on, s, f = o2(i);
    if (r) {
      for (var d = 0, g = r.length; d < g; ++d)
        if ((s = r[d]).type === l.type && s.name === l.name) {
          this.removeEventListener(s.type, s.listener, s.options), this.addEventListener(s.type, s.listener = f, s.options = o), s.value = i;
          return;
        }
    }
    this.addEventListener(l.type, f, o), s = { type: l.type, name: l.name, value: i, listener: f, options: o }, r ? r.push(s) : this.__on = [s];
  };
}
function f2(l, i, o) {
  var r = c2(l + ""), s, f = r.length, d;
  if (arguments.length < 2) {
    var g = this.node().__on;
    if (g) {
      for (var S = 0, v = g.length, y; S < v; ++S)
        for (s = 0, y = g[S]; s < f; ++s)
          if ((d = r[s]).type === y.type && d.name === y.name)
            return y.value;
    }
    return;
  }
  for (g = i ? s2 : r2, s = 0; s < f; ++s) this.each(g(r[s], i, o));
  return this;
}
function ap(l, i, o) {
  var r = Pv(l), s = r.CustomEvent;
  typeof s == "function" ? s = new s(i, o) : (s = r.document.createEvent("Event"), o ? (s.initEvent(i, o.bubbles, o.cancelable), s.detail = o.detail) : s.initEvent(i, !1, !1)), l.dispatchEvent(s);
}
function d2(l, i) {
  return function() {
    return ap(this, l, i);
  };
}
function h2(l, i) {
  return function() {
    return ap(this, l, i.apply(this, arguments));
  };
}
function g2(l, i) {
  return this.each((typeof i == "function" ? h2 : d2)(l, i));
}
function* m2() {
  for (var l = this._groups, i = 0, o = l.length; i < o; ++i)
    for (var r = l[i], s = 0, f = r.length, d; s < f; ++s)
      (d = r[s]) && (yield d);
}
var ip = [null];
function Je(l, i) {
  this._groups = l, this._parents = i;
}
function ku() {
  return new Je([[document.documentElement]], ip);
}
function y2() {
  return this;
}
Je.prototype = ku.prototype = {
  constructor: Je,
  select: jb,
  selectAll: Kb,
  selectChild: kb,
  selectChildren: tE,
  filter: eE,
  data: oE,
  enter: nE,
  exit: rE,
  join: sE,
  merge: fE,
  selection: y2,
  order: dE,
  sort: hE,
  call: mE,
  nodes: yE,
  node: vE,
  size: pE,
  empty: SE,
  each: xE,
  attr: ME,
  style: OE,
  property: UE,
  classed: LE,
  text: ZE,
  html: $E,
  raise: IE,
  lower: FE,
  append: WE,
  insert: t2,
  remove: n2,
  clone: i2,
  datum: u2,
  on: f2,
  dispatch: g2,
  [Symbol.iterator]: m2
};
function $e(l) {
  return typeof l == "string" ? new Je([[document.querySelector(l)]], [document.documentElement]) : new Je([[l]], ip);
}
var v2 = 0;
function Uy() {
  this._ = "@" + (++v2).toString(36);
}
Uy.prototype = {
  constructor: Uy,
  get: function(l) {
    for (var i = this._; !(i in l); ) if (!(l = l.parentNode)) return;
    return l[i];
  },
  set: function(l, i) {
    return l[this._] = i;
  },
  remove: function(l) {
    return this._ in l && delete l[this._];
  },
  toString: function() {
    return this._;
  }
};
function p2(l) {
  let i;
  for (; i = l.sourceEvent; ) l = i;
  return l;
}
function mn(l, i) {
  if (l = p2(l), i === void 0 && (i = l.currentTarget), i) {
    var o = i.ownerSVGElement || i;
    if (o.createSVGPoint) {
      var r = o.createSVGPoint();
      return r.x = l.clientX, r.y = l.clientY, r = r.matrixTransform(i.getScreenCTM().inverse()), [r.x, r.y];
    }
    if (i.getBoundingClientRect) {
      var s = i.getBoundingClientRect();
      return [l.clientX - s.left - i.clientLeft, l.clientY - s.top - i.clientTop];
    }
  }
  return [l.pageX, l.pageY];
}
const S2 = { passive: !1 }, qu = { capture: !0, passive: !1 };
function md(l) {
  l.stopImmediatePropagation();
}
function bi(l) {
  l.preventDefault(), l.stopImmediatePropagation();
}
function up(l) {
  var i = l.document.documentElement, o = $e(l).on("dragstart.drag", bi, qu);
  "onselectstart" in i ? o.on("selectstart.drag", bi, qu) : (i.__noselect = i.style.MozUserSelect, i.style.MozUserSelect = "none");
}
function op(l, i) {
  var o = l.document.documentElement, r = $e(l).on("dragstart.drag", null);
  i && (r.on("click.drag", bi, qu), setTimeout(function() {
    r.on("click.drag", null);
  }, 0)), "onselectstart" in o ? r.on("selectstart.drag", null) : (o.style.MozUserSelect = o.__noselect, delete o.__noselect);
}
var Vc = (l) => () => l;
function Rd(l, {
  sourceEvent: i,
  subject: o,
  target: r,
  identifier: s,
  active: f,
  x: d,
  y: g,
  dx: S,
  dy: v,
  dispatch: y
}) {
  Object.defineProperties(this, {
    type: { value: l, enumerable: !0, configurable: !0 },
    sourceEvent: { value: i, enumerable: !0, configurable: !0 },
    subject: { value: o, enumerable: !0, configurable: !0 },
    target: { value: r, enumerable: !0, configurable: !0 },
    identifier: { value: s, enumerable: !0, configurable: !0 },
    active: { value: f, enumerable: !0, configurable: !0 },
    x: { value: d, enumerable: !0, configurable: !0 },
    y: { value: g, enumerable: !0, configurable: !0 },
    dx: { value: S, enumerable: !0, configurable: !0 },
    dy: { value: v, enumerable: !0, configurable: !0 },
    _: { value: y }
  });
}
Rd.prototype.on = function() {
  var l = this._.on.apply(this._, arguments);
  return l === this._ ? this : l;
};
function x2(l) {
  return !l.ctrlKey && !l.button;
}
function b2() {
  return this.parentNode;
}
function E2(l, i) {
  return i ?? { x: l.x, y: l.y };
}
function _2() {
  return navigator.maxTouchPoints || "ontouchstart" in this;
}
function cp() {
  var l = x2, i = b2, o = E2, r = _2, s = {}, f = fr("start", "drag", "end"), d = 0, g, S, v, y, m = 0;
  function p(A) {
    A.on("mousedown.drag", b).filter(r).on("touchstart.drag", N).on("touchmove.drag", w, S2).on("touchend.drag touchcancel.drag", U).style("touch-action", "none").style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
  }
  function b(A, j) {
    if (!(y || !l.call(this, A, j))) {
      var B = _(this, i.call(this, A, j), A, j, "mouse");
      B && ($e(A.view).on("mousemove.drag", E, qu).on("mouseup.drag", C, qu), up(A.view), md(A), v = !1, g = A.clientX, S = A.clientY, B("start", A));
    }
  }
  function E(A) {
    if (bi(A), !v) {
      var j = A.clientX - g, B = A.clientY - S;
      v = j * j + B * B > m;
    }
    s.mouse("drag", A);
  }
  function C(A) {
    $e(A.view).on("mousemove.drag mouseup.drag", null), op(A.view, v), bi(A), s.mouse("end", A);
  }
  function N(A, j) {
    if (l.call(this, A, j)) {
      var B = A.changedTouches, R = i.call(this, A, j), Z = B.length, J, it;
      for (J = 0; J < Z; ++J)
        (it = _(this, R, A, j, B[J].identifier, B[J])) && (md(A), it("start", A, B[J]));
    }
  }
  function w(A) {
    var j = A.changedTouches, B = j.length, R, Z;
    for (R = 0; R < B; ++R)
      (Z = s[j[R].identifier]) && (bi(A), Z("drag", A, j[R]));
  }
  function U(A) {
    var j = A.changedTouches, B = j.length, R, Z;
    for (y && clearTimeout(y), y = setTimeout(function() {
      y = null;
    }, 500), R = 0; R < B; ++R)
      (Z = s[j[R].identifier]) && (md(A), Z("end", A, j[R]));
  }
  function _(A, j, B, R, Z, J) {
    var it = f.copy(), tt = mn(J || B, j), ot, lt, M;
    if ((M = o.call(A, new Rd("beforestart", {
      sourceEvent: B,
      target: p,
      identifier: Z,
      active: d,
      x: tt[0],
      y: tt[1],
      dx: 0,
      dy: 0,
      dispatch: it
    }), R)) != null)
      return ot = M.x - tt[0] || 0, lt = M.y - tt[1] || 0, function V(O, H, X) {
        var K = tt, F;
        switch (O) {
          case "start":
            s[Z] = V, F = d++;
            break;
          case "end":
            delete s[Z], --d;
          // falls through
          case "drag":
            tt = mn(X || H, j), F = d;
            break;
        }
        it.call(
          O,
          A,
          new Rd(O, {
            sourceEvent: H,
            subject: M,
            target: p,
            identifier: Z,
            active: F,
            x: tt[0] + ot,
            y: tt[1] + lt,
            dx: tt[0] - K[0],
            dy: tt[1] - K[1],
            dispatch: it
          }),
          R
        );
      };
  }
  return p.filter = function(A) {
    return arguments.length ? (l = typeof A == "function" ? A : Vc(!!A), p) : l;
  }, p.container = function(A) {
    return arguments.length ? (i = typeof A == "function" ? A : Vc(A), p) : i;
  }, p.subject = function(A) {
    return arguments.length ? (o = typeof A == "function" ? A : Vc(A), p) : o;
  }, p.touchable = function(A) {
    return arguments.length ? (r = typeof A == "function" ? A : Vc(!!A), p) : r;
  }, p.on = function() {
    var A = f.on.apply(f, arguments);
    return A === f ? p : A;
  }, p.clickDistance = function(A) {
    return arguments.length ? (m = (A = +A) * A, p) : Math.sqrt(m);
  }, p;
}
function Ri(l, i, o) {
  l.prototype = i.prototype = o, o.constructor = l;
}
function Fu(l, i) {
  var o = Object.create(l.prototype);
  for (var r in i) o[r] = i[r];
  return o;
}
function Xl() {
}
var Sa = 0.7, Ti = 1 / Sa, Ei = "\\s*([+-]?\\d+)\\s*", Xu = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*", Yn = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*", w2 = /^#([0-9a-f]{3,8})$/, N2 = new RegExp(`^rgb\\(${Ei},${Ei},${Ei}\\)$`), T2 = new RegExp(`^rgb\\(${Yn},${Yn},${Yn}\\)$`), M2 = new RegExp(`^rgba\\(${Ei},${Ei},${Ei},${Xu}\\)$`), z2 = new RegExp(`^rgba\\(${Yn},${Yn},${Yn},${Xu}\\)$`), C2 = new RegExp(`^hsl\\(${Xu},${Yn},${Yn}\\)$`), A2 = new RegExp(`^hsla\\(${Xu},${Yn},${Yn},${Xu}\\)$`), By = {
  aliceblue: 15792383,
  antiquewhite: 16444375,
  aqua: 65535,
  aquamarine: 8388564,
  azure: 15794175,
  beige: 16119260,
  bisque: 16770244,
  black: 0,
  blanchedalmond: 16772045,
  blue: 255,
  blueviolet: 9055202,
  brown: 10824234,
  burlywood: 14596231,
  cadetblue: 6266528,
  chartreuse: 8388352,
  chocolate: 13789470,
  coral: 16744272,
  cornflowerblue: 6591981,
  cornsilk: 16775388,
  crimson: 14423100,
  cyan: 65535,
  darkblue: 139,
  darkcyan: 35723,
  darkgoldenrod: 12092939,
  darkgray: 11119017,
  darkgreen: 25600,
  darkgrey: 11119017,
  darkkhaki: 12433259,
  darkmagenta: 9109643,
  darkolivegreen: 5597999,
  darkorange: 16747520,
  darkorchid: 10040012,
  darkred: 9109504,
  darksalmon: 15308410,
  darkseagreen: 9419919,
  darkslateblue: 4734347,
  darkslategray: 3100495,
  darkslategrey: 3100495,
  darkturquoise: 52945,
  darkviolet: 9699539,
  deeppink: 16716947,
  deepskyblue: 49151,
  dimgray: 6908265,
  dimgrey: 6908265,
  dodgerblue: 2003199,
  firebrick: 11674146,
  floralwhite: 16775920,
  forestgreen: 2263842,
  fuchsia: 16711935,
  gainsboro: 14474460,
  ghostwhite: 16316671,
  gold: 16766720,
  goldenrod: 14329120,
  gray: 8421504,
  green: 32768,
  greenyellow: 11403055,
  grey: 8421504,
  honeydew: 15794160,
  hotpink: 16738740,
  indianred: 13458524,
  indigo: 4915330,
  ivory: 16777200,
  khaki: 15787660,
  lavender: 15132410,
  lavenderblush: 16773365,
  lawngreen: 8190976,
  lemonchiffon: 16775885,
  lightblue: 11393254,
  lightcoral: 15761536,
  lightcyan: 14745599,
  lightgoldenrodyellow: 16448210,
  lightgray: 13882323,
  lightgreen: 9498256,
  lightgrey: 13882323,
  lightpink: 16758465,
  lightsalmon: 16752762,
  lightseagreen: 2142890,
  lightskyblue: 8900346,
  lightslategray: 7833753,
  lightslategrey: 7833753,
  lightsteelblue: 11584734,
  lightyellow: 16777184,
  lime: 65280,
  limegreen: 3329330,
  linen: 16445670,
  magenta: 16711935,
  maroon: 8388608,
  mediumaquamarine: 6737322,
  mediumblue: 205,
  mediumorchid: 12211667,
  mediumpurple: 9662683,
  mediumseagreen: 3978097,
  mediumslateblue: 8087790,
  mediumspringgreen: 64154,
  mediumturquoise: 4772300,
  mediumvioletred: 13047173,
  midnightblue: 1644912,
  mintcream: 16121850,
  mistyrose: 16770273,
  moccasin: 16770229,
  navajowhite: 16768685,
  navy: 128,
  oldlace: 16643558,
  olive: 8421376,
  olivedrab: 7048739,
  orange: 16753920,
  orangered: 16729344,
  orchid: 14315734,
  palegoldenrod: 15657130,
  palegreen: 10025880,
  paleturquoise: 11529966,
  palevioletred: 14381203,
  papayawhip: 16773077,
  peachpuff: 16767673,
  peru: 13468991,
  pink: 16761035,
  plum: 14524637,
  powderblue: 11591910,
  purple: 8388736,
  rebeccapurple: 6697881,
  red: 16711680,
  rosybrown: 12357519,
  royalblue: 4286945,
  saddlebrown: 9127187,
  salmon: 16416882,
  sandybrown: 16032864,
  seagreen: 3050327,
  seashell: 16774638,
  sienna: 10506797,
  silver: 12632256,
  skyblue: 8900331,
  slateblue: 6970061,
  slategray: 7372944,
  slategrey: 7372944,
  snow: 16775930,
  springgreen: 65407,
  steelblue: 4620980,
  tan: 13808780,
  teal: 32896,
  thistle: 14204888,
  tomato: 16737095,
  turquoise: 4251856,
  violet: 15631086,
  wheat: 16113331,
  white: 16777215,
  whitesmoke: 16119285,
  yellow: 16776960,
  yellowgreen: 10145074
};
Ri(Xl, xa, {
  copy(l) {
    return Object.assign(new this.constructor(), this, l);
  },
  displayable() {
    return this.rgb().displayable();
  },
  hex: Yy,
  // Deprecated! Use color.formatHex.
  formatHex: Yy,
  formatHex8: O2,
  formatHsl: D2,
  formatRgb: Vy,
  toString: Vy
});
function Yy() {
  return this.rgb().formatHex();
}
function O2() {
  return this.rgb().formatHex8();
}
function D2() {
  return rp(this).formatHsl();
}
function Vy() {
  return this.rgb().formatRgb();
}
function xa(l) {
  var i, o;
  return l = (l + "").trim().toLowerCase(), (i = w2.exec(l)) ? (o = i[1].length, i = parseInt(i[1], 16), o === 6 ? Ly(i) : o === 3 ? new he(i >> 8 & 15 | i >> 4 & 240, i >> 4 & 15 | i & 240, (i & 15) << 4 | i & 15, 1) : o === 8 ? Lc(i >> 24 & 255, i >> 16 & 255, i >> 8 & 255, (i & 255) / 255) : o === 4 ? Lc(i >> 12 & 15 | i >> 8 & 240, i >> 8 & 15 | i >> 4 & 240, i >> 4 & 15 | i & 240, ((i & 15) << 4 | i & 15) / 255) : null) : (i = N2.exec(l)) ? new he(i[1], i[2], i[3], 1) : (i = T2.exec(l)) ? new he(i[1] * 255 / 100, i[2] * 255 / 100, i[3] * 255 / 100, 1) : (i = M2.exec(l)) ? Lc(i[1], i[2], i[3], i[4]) : (i = z2.exec(l)) ? Lc(i[1] * 255 / 100, i[2] * 255 / 100, i[3] * 255 / 100, i[4]) : (i = C2.exec(l)) ? jy(i[1], i[2] / 100, i[3] / 100, 1) : (i = A2.exec(l)) ? jy(i[1], i[2] / 100, i[3] / 100, i[4]) : By.hasOwnProperty(l) ? Ly(By[l]) : l === "transparent" ? new he(NaN, NaN, NaN, 0) : null;
}
function Ly(l) {
  return new he(l >> 16 & 255, l >> 8 & 255, l & 255, 1);
}
function Lc(l, i, o, r) {
  return r <= 0 && (l = i = o = NaN), new he(l, i, o, r);
}
function Id(l) {
  return l instanceof Xl || (l = xa(l)), l ? (l = l.rgb(), new he(l.r, l.g, l.b, l.opacity)) : new he();
}
function Hd(l, i, o, r) {
  return arguments.length === 1 ? Id(l) : new he(l, i, o, r ?? 1);
}
function he(l, i, o, r) {
  this.r = +l, this.g = +i, this.b = +o, this.opacity = +r;
}
Ri(he, Hd, Fu(Xl, {
  brighter(l) {
    return l = l == null ? Ti : Math.pow(Ti, l), new he(this.r * l, this.g * l, this.b * l, this.opacity);
  },
  darker(l) {
    return l = l == null ? Sa : Math.pow(Sa, l), new he(this.r * l, this.g * l, this.b * l, this.opacity);
  },
  rgb() {
    return this;
  },
  clamp() {
    return new he(ya(this.r), ya(this.g), ya(this.b), Pc(this.opacity));
  },
  displayable() {
    return -0.5 <= this.r && this.r < 255.5 && -0.5 <= this.g && this.g < 255.5 && -0.5 <= this.b && this.b < 255.5 && 0 <= this.opacity && this.opacity <= 1;
  },
  hex: qy,
  // Deprecated! Use color.formatHex.
  formatHex: qy,
  formatHex8: R2,
  formatRgb: Xy,
  toString: Xy
}));
function qy() {
  return `#${ma(this.r)}${ma(this.g)}${ma(this.b)}`;
}
function R2() {
  return `#${ma(this.r)}${ma(this.g)}${ma(this.b)}${ma((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
}
function Xy() {
  const l = Pc(this.opacity);
  return `${l === 1 ? "rgb(" : "rgba("}${ya(this.r)}, ${ya(this.g)}, ${ya(this.b)}${l === 1 ? ")" : `, ${l})`}`;
}
function Pc(l) {
  return isNaN(l) ? 1 : Math.max(0, Math.min(1, l));
}
function ya(l) {
  return Math.max(0, Math.min(255, Math.round(l) || 0));
}
function ma(l) {
  return l = ya(l), (l < 16 ? "0" : "") + l.toString(16);
}
function jy(l, i, o, r) {
  return r <= 0 ? l = i = o = NaN : o <= 0 || o >= 1 ? l = i = NaN : i <= 0 && (l = NaN), new yn(l, i, o, r);
}
function rp(l) {
  if (l instanceof yn) return new yn(l.h, l.s, l.l, l.opacity);
  if (l instanceof Xl || (l = xa(l)), !l) return new yn();
  if (l instanceof yn) return l;
  l = l.rgb();
  var i = l.r / 255, o = l.g / 255, r = l.b / 255, s = Math.min(i, o, r), f = Math.max(i, o, r), d = NaN, g = f - s, S = (f + s) / 2;
  return g ? (i === f ? d = (o - r) / g + (o < r) * 6 : o === f ? d = (r - i) / g + 2 : d = (i - o) / g + 4, g /= S < 0.5 ? f + s : 2 - f - s, d *= 60) : g = S > 0 && S < 1 ? 0 : d, new yn(d, g, S, l.opacity);
}
function H2(l, i, o, r) {
  return arguments.length === 1 ? rp(l) : new yn(l, i, o, r ?? 1);
}
function yn(l, i, o, r) {
  this.h = +l, this.s = +i, this.l = +o, this.opacity = +r;
}
Ri(yn, H2, Fu(Xl, {
  brighter(l) {
    return l = l == null ? Ti : Math.pow(Ti, l), new yn(this.h, this.s, this.l * l, this.opacity);
  },
  darker(l) {
    return l = l == null ? Sa : Math.pow(Sa, l), new yn(this.h, this.s, this.l * l, this.opacity);
  },
  rgb() {
    var l = this.h % 360 + (this.h < 0) * 360, i = isNaN(l) || isNaN(this.s) ? 0 : this.s, o = this.l, r = o + (o < 0.5 ? o : 1 - o) * i, s = 2 * o - r;
    return new he(
      yd(l >= 240 ? l - 240 : l + 120, s, r),
      yd(l, s, r),
      yd(l < 120 ? l + 240 : l - 120, s, r),
      this.opacity
    );
  },
  clamp() {
    return new yn(Zy(this.h), qc(this.s), qc(this.l), Pc(this.opacity));
  },
  displayable() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && 0 <= this.l && this.l <= 1 && 0 <= this.opacity && this.opacity <= 1;
  },
  formatHsl() {
    const l = Pc(this.opacity);
    return `${l === 1 ? "hsl(" : "hsla("}${Zy(this.h)}, ${qc(this.s) * 100}%, ${qc(this.l) * 100}%${l === 1 ? ")" : `, ${l})`}`;
  }
}));
function Zy(l) {
  return l = (l || 0) % 360, l < 0 ? l + 360 : l;
}
function qc(l) {
  return Math.max(0, Math.min(1, l || 0));
}
function yd(l, i, o) {
  return (l < 60 ? i + (o - i) * l / 60 : l < 180 ? o : l < 240 ? i + (o - i) * (240 - l) / 60 : i) * 255;
}
const sp = Math.PI / 180, fp = 180 / Math.PI, tr = 18, dp = 0.96422, hp = 1, gp = 0.82521, mp = 4 / 29, _i = 6 / 29, yp = 3 * _i * _i, U2 = _i * _i * _i;
function vp(l) {
  if (l instanceof Vn) return new Vn(l.l, l.a, l.b, l.opacity);
  if (l instanceof al) return pp(l);
  l instanceof he || (l = Id(l));
  var i = xd(l.r), o = xd(l.g), r = xd(l.b), s = vd((0.2225045 * i + 0.7168786 * o + 0.0606169 * r) / hp), f, d;
  return i === o && o === r ? f = d = s : (f = vd((0.4360747 * i + 0.3850649 * o + 0.1430804 * r) / dp), d = vd((0.0139322 * i + 0.0971045 * o + 0.7141733 * r) / gp)), new Vn(116 * s - 16, 500 * (f - s), 200 * (s - d), l.opacity);
}
function B2(l, i, o, r) {
  return arguments.length === 1 ? vp(l) : new Vn(l, i, o, r ?? 1);
}
function Vn(l, i, o, r) {
  this.l = +l, this.a = +i, this.b = +o, this.opacity = +r;
}
Ri(Vn, B2, Fu(Xl, {
  brighter(l) {
    return new Vn(this.l + tr * (l ?? 1), this.a, this.b, this.opacity);
  },
  darker(l) {
    return new Vn(this.l - tr * (l ?? 1), this.a, this.b, this.opacity);
  },
  rgb() {
    var l = (this.l + 16) / 116, i = isNaN(this.a) ? l : l + this.a / 500, o = isNaN(this.b) ? l : l - this.b / 200;
    return i = dp * pd(i), l = hp * pd(l), o = gp * pd(o), new he(
      Sd(3.1338561 * i - 1.6168667 * l - 0.4906146 * o),
      Sd(-0.9787684 * i + 1.9161415 * l + 0.033454 * o),
      Sd(0.0719453 * i - 0.2289914 * l + 1.4052427 * o),
      this.opacity
    );
  }
}));
function vd(l) {
  return l > U2 ? Math.pow(l, 1 / 3) : l / yp + mp;
}
function pd(l) {
  return l > _i ? l * l * l : yp * (l - mp);
}
function Sd(l) {
  return 255 * (l <= 31308e-7 ? 12.92 * l : 1.055 * Math.pow(l, 1 / 2.4) - 0.055);
}
function xd(l) {
  return (l /= 255) <= 0.04045 ? l / 12.92 : Math.pow((l + 0.055) / 1.055, 2.4);
}
function Y2(l) {
  if (l instanceof al) return new al(l.h, l.c, l.l, l.opacity);
  if (l instanceof Vn || (l = vp(l)), l.a === 0 && l.b === 0) return new al(NaN, 0 < l.l && l.l < 100 ? 0 : NaN, l.l, l.opacity);
  var i = Math.atan2(l.b, l.a) * fp;
  return new al(i < 0 ? i + 360 : i, Math.sqrt(l.a * l.a + l.b * l.b), l.l, l.opacity);
}
function V2(l, i, o, r) {
  return arguments.length === 1 ? Y2(l) : new al(l, i, o, r ?? 1);
}
function al(l, i, o, r) {
  this.h = +l, this.c = +i, this.l = +o, this.opacity = +r;
}
function pp(l) {
  if (isNaN(l.h)) return new Vn(l.l, 0, 0, l.opacity);
  var i = l.h * sp;
  return new Vn(l.l, Math.cos(i) * l.c, Math.sin(i) * l.c, l.opacity);
}
Ri(al, V2, Fu(Xl, {
  brighter(l) {
    return new al(this.h, this.c, this.l + tr * (l ?? 1), this.opacity);
  },
  darker(l) {
    return new al(this.h, this.c, this.l - tr * (l ?? 1), this.opacity);
  },
  rgb() {
    return pp(this).rgb();
  }
}));
var Sp = -0.14861, kd = 1.78277, Fd = -0.29227, hr = -0.90649, ju = 1.97294, Gy = ju * hr, Qy = ju * kd, Ky = kd * Fd - hr * Sp;
function L2(l) {
  if (l instanceof va) return new va(l.h, l.s, l.l, l.opacity);
  l instanceof he || (l = Id(l));
  var i = l.r / 255, o = l.g / 255, r = l.b / 255, s = (Ky * r + Gy * i - Qy * o) / (Ky + Gy - Qy), f = r - s, d = (ju * (o - s) - Fd * f) / hr, g = Math.sqrt(d * d + f * f) / (ju * s * (1 - s)), S = g ? Math.atan2(d, f) * fp - 120 : NaN;
  return new va(S < 0 ? S + 360 : S, g, s, l.opacity);
}
function Ud(l, i, o, r) {
  return arguments.length === 1 ? L2(l) : new va(l, i, o, r ?? 1);
}
function va(l, i, o, r) {
  this.h = +l, this.s = +i, this.l = +o, this.opacity = +r;
}
Ri(va, Ud, Fu(Xl, {
  brighter(l) {
    return l = l == null ? Ti : Math.pow(Ti, l), new va(this.h, this.s, this.l * l, this.opacity);
  },
  darker(l) {
    return l = l == null ? Sa : Math.pow(Sa, l), new va(this.h, this.s, this.l * l, this.opacity);
  },
  rgb() {
    var l = isNaN(this.h) ? 0 : (this.h + 120) * sp, i = +this.l, o = isNaN(this.s) ? 0 : this.s * i * (1 - i), r = Math.cos(l), s = Math.sin(l);
    return new he(
      255 * (i + o * (Sp * r + kd * s)),
      255 * (i + o * (Fd * r + hr * s)),
      255 * (i + o * (ju * r)),
      this.opacity
    );
  }
}));
var gr = (l) => () => l;
function xp(l, i) {
  return function(o) {
    return l + o * i;
  };
}
function q2(l, i, o) {
  return l = Math.pow(l, o), i = Math.pow(i, o) - l, o = 1 / o, function(r) {
    return Math.pow(l + r * i, o);
  };
}
function X2(l, i) {
  var o = i - l;
  return o ? xp(l, o > 180 || o < -180 ? o - 360 * Math.round(o / 360) : o) : gr(isNaN(l) ? i : l);
}
function j2(l) {
  return (l = +l) == 1 ? wi : function(i, o) {
    return o - i ? q2(i, o, l) : gr(isNaN(i) ? o : i);
  };
}
function wi(l, i) {
  var o = i - l;
  return o ? xp(l, o) : gr(isNaN(l) ? i : l);
}
var er = (function l(i) {
  var o = j2(i);
  function r(s, f) {
    var d = o((s = Hd(s)).r, (f = Hd(f)).r), g = o(s.g, f.g), S = o(s.b, f.b), v = wi(s.opacity, f.opacity);
    return function(y) {
      return s.r = d(y), s.g = g(y), s.b = S(y), s.opacity = v(y), s + "";
    };
  }
  return r.gamma = l, r;
})(1);
function Z2(l, i) {
  i || (i = []);
  var o = l ? Math.min(i.length, l.length) : 0, r = i.slice(), s;
  return function(f) {
    for (s = 0; s < o; ++s) r[s] = l[s] * (1 - f) + i[s] * f;
    return r;
  };
}
function G2(l) {
  return ArrayBuffer.isView(l) && !(l instanceof DataView);
}
function Q2(l, i) {
  var o = i ? i.length : 0, r = l ? Math.min(o, l.length) : 0, s = new Array(r), f = new Array(o), d;
  for (d = 0; d < r; ++d) s[d] = Vu(l[d], i[d]);
  for (; d < o; ++d) f[d] = i[d];
  return function(g) {
    for (d = 0; d < r; ++d) f[d] = s[d](g);
    return f;
  };
}
function K2(l, i) {
  var o = /* @__PURE__ */ new Date();
  return l = +l, i = +i, function(r) {
    return o.setTime(l * (1 - r) + i * r), o;
  };
}
function Bn(l, i) {
  return l = +l, i = +i, function(o) {
    return l * (1 - o) + i * o;
  };
}
function $2(l, i) {
  var o = {}, r = {}, s;
  (l === null || typeof l != "object") && (l = {}), (i === null || typeof i != "object") && (i = {});
  for (s in i)
    s in l ? o[s] = Vu(l[s], i[s]) : r[s] = i[s];
  return function(f) {
    for (s in o) r[s] = o[s](f);
    return r;
  };
}
var Bd = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g, bd = new RegExp(Bd.source, "g");
function J2(l) {
  return function() {
    return l;
  };
}
function I2(l) {
  return function(i) {
    return l(i) + "";
  };
}
function bp(l, i) {
  var o = Bd.lastIndex = bd.lastIndex = 0, r, s, f, d = -1, g = [], S = [];
  for (l = l + "", i = i + ""; (r = Bd.exec(l)) && (s = bd.exec(i)); )
    (f = s.index) > o && (f = i.slice(o, f), g[d] ? g[d] += f : g[++d] = f), (r = r[0]) === (s = s[0]) ? g[d] ? g[d] += s : g[++d] = s : (g[++d] = null, S.push({ i: d, x: Bn(r, s) })), o = bd.lastIndex;
  return o < i.length && (f = i.slice(o), g[d] ? g[d] += f : g[++d] = f), g.length < 2 ? S[0] ? I2(S[0].x) : J2(i) : (i = S.length, function(v) {
    for (var y = 0, m; y < i; ++y) g[(m = S[y]).i] = m.x(v);
    return g.join("");
  });
}
function Vu(l, i) {
  var o = typeof i, r;
  return i == null || o === "boolean" ? gr(i) : (o === "number" ? Bn : o === "string" ? (r = xa(i)) ? (i = r, er) : bp : i instanceof xa ? er : i instanceof Date ? K2 : G2(i) ? Z2 : Array.isArray(i) ? Q2 : typeof i.valueOf != "function" && typeof i.toString != "function" || isNaN(i) ? $2 : Bn)(l, i);
}
var $y = 180 / Math.PI, Yd = {
  translateX: 0,
  translateY: 0,
  rotate: 0,
  skewX: 0,
  scaleX: 1,
  scaleY: 1
};
function Ep(l, i, o, r, s, f) {
  var d, g, S;
  return (d = Math.sqrt(l * l + i * i)) && (l /= d, i /= d), (S = l * o + i * r) && (o -= l * S, r -= i * S), (g = Math.sqrt(o * o + r * r)) && (o /= g, r /= g, S /= g), l * r < i * o && (l = -l, i = -i, S = -S, d = -d), {
    translateX: s,
    translateY: f,
    rotate: Math.atan2(i, l) * $y,
    skewX: Math.atan(S) * $y,
    scaleX: d,
    scaleY: g
  };
}
var Xc;
function k2(l) {
  const i = new (typeof DOMMatrix == "function" ? DOMMatrix : WebKitCSSMatrix)(l + "");
  return i.isIdentity ? Yd : Ep(i.a, i.b, i.c, i.d, i.e, i.f);
}
function F2(l) {
  return l == null || (Xc || (Xc = document.createElementNS("http://www.w3.org/2000/svg", "g")), Xc.setAttribute("transform", l), !(l = Xc.transform.baseVal.consolidate())) ? Yd : (l = l.matrix, Ep(l.a, l.b, l.c, l.d, l.e, l.f));
}
function _p(l, i, o, r) {
  function s(v) {
    return v.length ? v.pop() + " " : "";
  }
  function f(v, y, m, p, b, E) {
    if (v !== m || y !== p) {
      var C = b.push("translate(", null, i, null, o);
      E.push({ i: C - 4, x: Bn(v, m) }, { i: C - 2, x: Bn(y, p) });
    } else (m || p) && b.push("translate(" + m + i + p + o);
  }
  function d(v, y, m, p) {
    v !== y ? (v - y > 180 ? y += 360 : y - v > 180 && (v += 360), p.push({ i: m.push(s(m) + "rotate(", null, r) - 2, x: Bn(v, y) })) : y && m.push(s(m) + "rotate(" + y + r);
  }
  function g(v, y, m, p) {
    v !== y ? p.push({ i: m.push(s(m) + "skewX(", null, r) - 2, x: Bn(v, y) }) : y && m.push(s(m) + "skewX(" + y + r);
  }
  function S(v, y, m, p, b, E) {
    if (v !== m || y !== p) {
      var C = b.push(s(b) + "scale(", null, ",", null, ")");
      E.push({ i: C - 4, x: Bn(v, m) }, { i: C - 2, x: Bn(y, p) });
    } else (m !== 1 || p !== 1) && b.push(s(b) + "scale(" + m + "," + p + ")");
  }
  return function(v, y) {
    var m = [], p = [];
    return v = l(v), y = l(y), f(v.translateX, v.translateY, y.translateX, y.translateY, m, p), d(v.rotate, y.rotate, m, p), g(v.skewX, y.skewX, m, p), S(v.scaleX, v.scaleY, y.scaleX, y.scaleY, m, p), v = y = null, function(b) {
      for (var E = -1, C = p.length, N; ++E < C; ) m[(N = p[E]).i] = N.x(b);
      return m.join("");
    };
  };
}
var W2 = _p(k2, "px, ", "px)", "deg)"), P2 = _p(F2, ", ", ")", ")"), t_ = 1e-12;
function Jy(l) {
  return ((l = Math.exp(l)) + 1 / l) / 2;
}
function e_(l) {
  return ((l = Math.exp(l)) - 1 / l) / 2;
}
function n_(l) {
  return ((l = Math.exp(2 * l)) - 1) / (l + 1);
}
var Jc = (function l(i, o, r) {
  function s(f, d) {
    var g = f[0], S = f[1], v = f[2], y = d[0], m = d[1], p = d[2], b = y - g, E = m - S, C = b * b + E * E, N, w;
    if (C < t_)
      w = Math.log(p / v) / i, N = function(R) {
        return [
          g + R * b,
          S + R * E,
          v * Math.exp(i * R * w)
        ];
      };
    else {
      var U = Math.sqrt(C), _ = (p * p - v * v + r * C) / (2 * v * o * U), A = (p * p - v * v - r * C) / (2 * p * o * U), j = Math.log(Math.sqrt(_ * _ + 1) - _), B = Math.log(Math.sqrt(A * A + 1) - A);
      w = (B - j) / i, N = function(R) {
        var Z = R * w, J = Jy(j), it = v / (o * U) * (J * n_(i * Z + j) - e_(j));
        return [
          g + it * b,
          S + it * E,
          v * J / Jy(i * Z + j)
        ];
      };
    }
    return N.duration = Math.abs(w) * 1e3 * i / Math.SQRT2, N;
  }
  return s.rho = function(f) {
    var d = Math.max(1e-3, +f), g = d * d, S = g * g;
    return l(d, g, S);
  }, s;
})(Math.SQRT2, 2, 4);
function wp(l) {
  return (function i(o) {
    o = +o;
    function r(s, f) {
      var d = l((s = Ud(s)).h, (f = Ud(f)).h), g = wi(s.s, f.s), S = wi(s.l, f.l), v = wi(s.opacity, f.opacity);
      return function(y) {
        return s.h = d(y), s.s = g(y), s.l = S(Math.pow(y, o)), s.opacity = v(y), s + "";
      };
    }
    return r.gamma = i, r;
  })(1);
}
wp(X2);
wp(wi);
var Mi = 0, Bu = 0, Hu = 0, Np = 1e3, nr, Yu, lr = 0, ba = 0, mr = 0, Zu = typeof performance == "object" && performance.now ? performance : Date, Tp = typeof window == "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(l) {
  setTimeout(l, 17);
};
function Wd() {
  return ba || (Tp(l_), ba = Zu.now() + mr);
}
function l_() {
  ba = 0;
}
function ar() {
  this._call = this._time = this._next = null;
}
ar.prototype = Mp.prototype = {
  constructor: ar,
  restart: function(l, i, o) {
    if (typeof l != "function") throw new TypeError("callback is not a function");
    o = (o == null ? Wd() : +o) + (i == null ? 0 : +i), !this._next && Yu !== this && (Yu ? Yu._next = this : nr = this, Yu = this), this._call = l, this._time = o, Vd();
  },
  stop: function() {
    this._call && (this._call = null, this._time = 1 / 0, Vd());
  }
};
function Mp(l, i, o) {
  var r = new ar();
  return r.restart(l, i, o), r;
}
function a_() {
  Wd(), ++Mi;
  for (var l = nr, i; l; )
    (i = ba - l._time) >= 0 && l._call.call(void 0, i), l = l._next;
  --Mi;
}
function Iy() {
  ba = (lr = Zu.now()) + mr, Mi = Bu = 0;
  try {
    a_();
  } finally {
    Mi = 0, u_(), ba = 0;
  }
}
function i_() {
  var l = Zu.now(), i = l - lr;
  i > Np && (mr -= i, lr = l);
}
function u_() {
  for (var l, i = nr, o, r = 1 / 0; i; )
    i._call ? (r > i._time && (r = i._time), l = i, i = i._next) : (o = i._next, i._next = null, i = l ? l._next = o : nr = o);
  Yu = l, Vd(r);
}
function Vd(l) {
  if (!Mi) {
    Bu && (Bu = clearTimeout(Bu));
    var i = l - ba;
    i > 24 ? (l < 1 / 0 && (Bu = setTimeout(Iy, Math.ceil(l - Zu.now() - mr) + 1)), Hu && (Hu = clearInterval(Hu))) : (Hu || (lr = Zu.now(), Hu = setInterval(i_, Np)), Mi = 1, Tp(Iy));
  }
}
function ky(l, i, o) {
  var r = new ar();
  return i = i == null ? 0 : +i, r.restart((s) => {
    r.stop(), l(s + i);
  }, i, o), r;
}
function o_(l) {
  return ((l *= 2) <= 1 ? l * l * l : (l -= 2) * l * l + 2) / 2;
}
var Pd = 3;
(function l(i) {
  i = +i;
  function o(r) {
    return Math.pow(r, i);
  }
  return o.exponent = l, o;
})(Pd);
(function l(i) {
  i = +i;
  function o(r) {
    return 1 - Math.pow(1 - r, i);
  }
  return o.exponent = l, o;
})(Pd);
(function l(i) {
  i = +i;
  function o(r) {
    return ((r *= 2) <= 1 ? Math.pow(r, i) : 2 - Math.pow(2 - r, i)) / 2;
  }
  return o.exponent = l, o;
})(Pd);
function ir(l) {
  return (Math.pow(2, -10 * l) - 9765625e-10) * 1.0009775171065494;
}
var th = 1.70158;
(function l(i) {
  i = +i;
  function o(r) {
    return (r = +r) * r * (i * (r - 1) + r);
  }
  return o.overshoot = l, o;
})(th);
(function l(i) {
  i = +i;
  function o(r) {
    return --r * r * ((r + 1) * i + r) + 1;
  }
  return o.overshoot = l, o;
})(th);
(function l(i) {
  i = +i;
  function o(r) {
    return ((r *= 2) < 1 ? r * r * ((i + 1) * r - i) : (r -= 2) * r * ((i + 1) * r + i) + 2) / 2;
  }
  return o.overshoot = l, o;
})(th);
var zi = 2 * Math.PI, eh = 1, nh = 0.3;
(function l(i, o) {
  var r = Math.asin(1 / (i = Math.max(1, i))) * (o /= zi);
  function s(f) {
    return i * ir(- --f) * Math.sin((r - f) / o);
  }
  return s.amplitude = function(f) {
    return l(f, o * zi);
  }, s.period = function(f) {
    return l(i, f);
  }, s;
})(eh, nh);
(function l(i, o) {
  var r = Math.asin(1 / (i = Math.max(1, i))) * (o /= zi);
  function s(f) {
    return 1 - i * ir(f = +f) * Math.sin((f + r) / o);
  }
  return s.amplitude = function(f) {
    return l(f, o * zi);
  }, s.period = function(f) {
    return l(i, f);
  }, s;
})(eh, nh);
(function l(i, o) {
  var r = Math.asin(1 / (i = Math.max(1, i))) * (o /= zi);
  function s(f) {
    return ((f = f * 2 - 1) < 0 ? i * ir(-f) * Math.sin((r - f) / o) : 2 - i * ir(f) * Math.sin((r + f) / o)) / 2;
  }
  return s.amplitude = function(f) {
    return l(f, o * zi);
  }, s.period = function(f) {
    return l(i, f);
  }, s;
})(eh, nh);
var c_ = fr("start", "end", "cancel", "interrupt"), r_ = [], zp = 0, Fy = 1, Ld = 2, Ic = 3, Wy = 4, qd = 5, kc = 6;
function yr(l, i, o, r, s, f) {
  var d = l.__transition;
  if (!d) l.__transition = {};
  else if (o in d) return;
  s_(l, o, {
    name: i,
    index: r,
    // For context during callback.
    group: s,
    // For context during callback.
    on: c_,
    tween: r_,
    time: f.time,
    delay: f.delay,
    duration: f.duration,
    ease: f.ease,
    timer: null,
    state: zp
  });
}
function lh(l, i) {
  var o = xn(l, i);
  if (o.state > zp) throw new Error("too late; already scheduled");
  return o;
}
function Ln(l, i) {
  var o = xn(l, i);
  if (o.state > Ic) throw new Error("too late; already running");
  return o;
}
function xn(l, i) {
  var o = l.__transition;
  if (!o || !(o = o[i])) throw new Error("transition not found");
  return o;
}
function s_(l, i, o) {
  var r = l.__transition, s;
  r[i] = o, o.timer = Mp(f, 0, o.time);
  function f(v) {
    o.state = Fy, o.timer.restart(d, o.delay, o.time), o.delay <= v && d(v - o.delay);
  }
  function d(v) {
    var y, m, p, b;
    if (o.state !== Fy) return S();
    for (y in r)
      if (b = r[y], b.name === o.name) {
        if (b.state === Ic) return ky(d);
        b.state === Wy ? (b.state = kc, b.timer.stop(), b.on.call("interrupt", l, l.__data__, b.index, b.group), delete r[y]) : +y < i && (b.state = kc, b.timer.stop(), b.on.call("cancel", l, l.__data__, b.index, b.group), delete r[y]);
      }
    if (ky(function() {
      o.state === Ic && (o.state = Wy, o.timer.restart(g, o.delay, o.time), g(v));
    }), o.state = Ld, o.on.call("start", l, l.__data__, o.index, o.group), o.state === Ld) {
      for (o.state = Ic, s = new Array(p = o.tween.length), y = 0, m = -1; y < p; ++y)
        (b = o.tween[y].value.call(l, l.__data__, o.index, o.group)) && (s[++m] = b);
      s.length = m + 1;
    }
  }
  function g(v) {
    for (var y = v < o.duration ? o.ease.call(null, v / o.duration) : (o.timer.restart(S), o.state = qd, 1), m = -1, p = s.length; ++m < p; )
      s[m].call(l, y);
    o.state === qd && (o.on.call("end", l, l.__data__, o.index, o.group), S());
  }
  function S() {
    o.state = kc, o.timer.stop(), delete r[i];
    for (var v in r) return;
    delete l.__transition;
  }
}
function Fc(l, i) {
  var o = l.__transition, r, s, f = !0, d;
  if (o) {
    i = i == null ? null : i + "";
    for (d in o) {
      if ((r = o[d]).name !== i) {
        f = !1;
        continue;
      }
      s = r.state > Ld && r.state < qd, r.state = kc, r.timer.stop(), r.on.call(s ? "interrupt" : "cancel", l, l.__data__, r.index, r.group), delete o[d];
    }
    f && delete l.__transition;
  }
}
function f_(l) {
  return this.each(function() {
    Fc(this, l);
  });
}
function d_(l, i) {
  var o, r;
  return function() {
    var s = Ln(this, l), f = s.tween;
    if (f !== o) {
      r = o = f;
      for (var d = 0, g = r.length; d < g; ++d)
        if (r[d].name === i) {
          r = r.slice(), r.splice(d, 1);
          break;
        }
    }
    s.tween = r;
  };
}
function h_(l, i, o) {
  var r, s;
  if (typeof o != "function") throw new Error();
  return function() {
    var f = Ln(this, l), d = f.tween;
    if (d !== r) {
      s = (r = d).slice();
      for (var g = { name: i, value: o }, S = 0, v = s.length; S < v; ++S)
        if (s[S].name === i) {
          s[S] = g;
          break;
        }
      S === v && s.push(g);
    }
    f.tween = s;
  };
}
function g_(l, i) {
  var o = this._id;
  if (l += "", arguments.length < 2) {
    for (var r = xn(this.node(), o).tween, s = 0, f = r.length, d; s < f; ++s)
      if ((d = r[s]).name === l)
        return d.value;
    return null;
  }
  return this.each((i == null ? d_ : h_)(o, l, i));
}
function ah(l, i, o) {
  var r = l._id;
  return l.each(function() {
    var s = Ln(this, r);
    (s.value || (s.value = {}))[i] = o.apply(this, arguments);
  }), function(s) {
    return xn(s, r).value[i];
  };
}
function Cp(l, i) {
  var o;
  return (typeof i == "number" ? Bn : i instanceof xa ? er : (o = xa(i)) ? (i = o, er) : bp)(l, i);
}
function m_(l) {
  return function() {
    this.removeAttribute(l);
  };
}
function y_(l) {
  return function() {
    this.removeAttributeNS(l.space, l.local);
  };
}
function v_(l, i, o) {
  var r, s = o + "", f;
  return function() {
    var d = this.getAttribute(l);
    return d === s ? null : d === r ? f : f = i(r = d, o);
  };
}
function p_(l, i, o) {
  var r, s = o + "", f;
  return function() {
    var d = this.getAttributeNS(l.space, l.local);
    return d === s ? null : d === r ? f : f = i(r = d, o);
  };
}
function S_(l, i, o) {
  var r, s, f;
  return function() {
    var d, g = o(this), S;
    return g == null ? void this.removeAttribute(l) : (d = this.getAttribute(l), S = g + "", d === S ? null : d === r && S === s ? f : (s = S, f = i(r = d, g)));
  };
}
function x_(l, i, o) {
  var r, s, f;
  return function() {
    var d, g = o(this), S;
    return g == null ? void this.removeAttributeNS(l.space, l.local) : (d = this.getAttributeNS(l.space, l.local), S = g + "", d === S ? null : d === r && S === s ? f : (s = S, f = i(r = d, g)));
  };
}
function b_(l, i) {
  var o = dr(l), r = o === "transform" ? P2 : Cp;
  return this.attrTween(l, typeof i == "function" ? (o.local ? x_ : S_)(o, r, ah(this, "attr." + l, i)) : i == null ? (o.local ? y_ : m_)(o) : (o.local ? p_ : v_)(o, r, i));
}
function E_(l, i) {
  return function(o) {
    this.setAttribute(l, i.call(this, o));
  };
}
function __(l, i) {
  return function(o) {
    this.setAttributeNS(l.space, l.local, i.call(this, o));
  };
}
function w_(l, i) {
  var o, r;
  function s() {
    var f = i.apply(this, arguments);
    return f !== r && (o = (r = f) && __(l, f)), o;
  }
  return s._value = i, s;
}
function N_(l, i) {
  var o, r;
  function s() {
    var f = i.apply(this, arguments);
    return f !== r && (o = (r = f) && E_(l, f)), o;
  }
  return s._value = i, s;
}
function T_(l, i) {
  var o = "attr." + l;
  if (arguments.length < 2) return (o = this.tween(o)) && o._value;
  if (i == null) return this.tween(o, null);
  if (typeof i != "function") throw new Error();
  var r = dr(l);
  return this.tween(o, (r.local ? w_ : N_)(r, i));
}
function M_(l, i) {
  return function() {
    lh(this, l).delay = +i.apply(this, arguments);
  };
}
function z_(l, i) {
  return i = +i, function() {
    lh(this, l).delay = i;
  };
}
function C_(l) {
  var i = this._id;
  return arguments.length ? this.each((typeof l == "function" ? M_ : z_)(i, l)) : xn(this.node(), i).delay;
}
function A_(l, i) {
  return function() {
    Ln(this, l).duration = +i.apply(this, arguments);
  };
}
function O_(l, i) {
  return i = +i, function() {
    Ln(this, l).duration = i;
  };
}
function D_(l) {
  var i = this._id;
  return arguments.length ? this.each((typeof l == "function" ? A_ : O_)(i, l)) : xn(this.node(), i).duration;
}
function R_(l, i) {
  if (typeof i != "function") throw new Error();
  return function() {
    Ln(this, l).ease = i;
  };
}
function H_(l) {
  var i = this._id;
  return arguments.length ? this.each(R_(i, l)) : xn(this.node(), i).ease;
}
function U_(l, i) {
  return function() {
    var o = i.apply(this, arguments);
    if (typeof o != "function") throw new Error();
    Ln(this, l).ease = o;
  };
}
function B_(l) {
  if (typeof l != "function") throw new Error();
  return this.each(U_(this._id, l));
}
function Y_(l) {
  typeof l != "function" && (l = kv(l));
  for (var i = this._groups, o = i.length, r = new Array(o), s = 0; s < o; ++s)
    for (var f = i[s], d = f.length, g = r[s] = [], S, v = 0; v < d; ++v)
      (S = f[v]) && l.call(S, S.__data__, v, f) && g.push(S);
  return new ul(r, this._parents, this._name, this._id);
}
function V_(l) {
  if (l._id !== this._id) throw new Error();
  for (var i = this._groups, o = l._groups, r = i.length, s = o.length, f = Math.min(r, s), d = new Array(r), g = 0; g < f; ++g)
    for (var S = i[g], v = o[g], y = S.length, m = d[g] = new Array(y), p, b = 0; b < y; ++b)
      (p = S[b] || v[b]) && (m[b] = p);
  for (; g < r; ++g)
    d[g] = i[g];
  return new ul(d, this._parents, this._name, this._id);
}
function L_(l) {
  return (l + "").trim().split(/^|\s+/).every(function(i) {
    var o = i.indexOf(".");
    return o >= 0 && (i = i.slice(0, o)), !i || i === "start";
  });
}
function q_(l, i, o) {
  var r, s, f = L_(i) ? lh : Ln;
  return function() {
    var d = f(this, l), g = d.on;
    g !== r && (s = (r = g).copy()).on(i, o), d.on = s;
  };
}
function X_(l, i) {
  var o = this._id;
  return arguments.length < 2 ? xn(this.node(), o).on.on(l) : this.each(q_(o, l, i));
}
function j_(l) {
  return function() {
    var i = this.parentNode;
    for (var o in this.__transition) if (+o !== l) return;
    i && i.removeChild(this);
  };
}
function Z_() {
  return this.on("end.remove", j_(this._id));
}
function G_(l) {
  var i = this._name, o = this._id;
  typeof l != "function" && (l = $d(l));
  for (var r = this._groups, s = r.length, f = new Array(s), d = 0; d < s; ++d)
    for (var g = r[d], S = g.length, v = f[d] = new Array(S), y, m, p = 0; p < S; ++p)
      (y = g[p]) && (m = l.call(y, y.__data__, p, g)) && ("__data__" in y && (m.__data__ = y.__data__), v[p] = m, yr(v[p], i, o, p, v, xn(y, o)));
  return new ul(f, this._parents, i, o);
}
function Q_(l) {
  var i = this._name, o = this._id;
  typeof l != "function" && (l = Iv(l));
  for (var r = this._groups, s = r.length, f = [], d = [], g = 0; g < s; ++g)
    for (var S = r[g], v = S.length, y, m = 0; m < v; ++m)
      if (y = S[m]) {
        for (var p = l.call(y, y.__data__, m, S), b, E = xn(y, o), C = 0, N = p.length; C < N; ++C)
          (b = p[C]) && yr(b, i, o, C, p, E);
        f.push(p), d.push(y);
      }
  return new ul(f, d, i, o);
}
var K_ = ku.prototype.constructor;
function $_() {
  return new K_(this._groups, this._parents);
}
function J_(l, i) {
  var o, r, s;
  return function() {
    var f = Ni(this, l), d = (this.style.removeProperty(l), Ni(this, l));
    return f === d ? null : f === o && d === r ? s : s = i(o = f, r = d);
  };
}
function Ap(l) {
  return function() {
    this.style.removeProperty(l);
  };
}
function I_(l, i, o) {
  var r, s = o + "", f;
  return function() {
    var d = Ni(this, l);
    return d === s ? null : d === r ? f : f = i(r = d, o);
  };
}
function k_(l, i, o) {
  var r, s, f;
  return function() {
    var d = Ni(this, l), g = o(this), S = g + "";
    return g == null && (S = g = (this.style.removeProperty(l), Ni(this, l))), d === S ? null : d === r && S === s ? f : (s = S, f = i(r = d, g));
  };
}
function F_(l, i) {
  var o, r, s, f = "style." + i, d = "end." + f, g;
  return function() {
    var S = Ln(this, l), v = S.on, y = S.value[f] == null ? g || (g = Ap(i)) : void 0;
    (v !== o || s !== y) && (r = (o = v).copy()).on(d, s = y), S.on = r;
  };
}
function W_(l, i, o) {
  var r = (l += "") == "transform" ? W2 : Cp;
  return i == null ? this.styleTween(l, J_(l, r)).on("end.style." + l, Ap(l)) : typeof i == "function" ? this.styleTween(l, k_(l, r, ah(this, "style." + l, i))).each(F_(this._id, l)) : this.styleTween(l, I_(l, r, i), o).on("end.style." + l, null);
}
function P_(l, i, o) {
  return function(r) {
    this.style.setProperty(l, i.call(this, r), o);
  };
}
function tw(l, i, o) {
  var r, s;
  function f() {
    var d = i.apply(this, arguments);
    return d !== s && (r = (s = d) && P_(l, d, o)), r;
  }
  return f._value = i, f;
}
function ew(l, i, o) {
  var r = "style." + (l += "");
  if (arguments.length < 2) return (r = this.tween(r)) && r._value;
  if (i == null) return this.tween(r, null);
  if (typeof i != "function") throw new Error();
  return this.tween(r, tw(l, i, o ?? ""));
}
function nw(l) {
  return function() {
    this.textContent = l;
  };
}
function lw(l) {
  return function() {
    var i = l(this);
    this.textContent = i ?? "";
  };
}
function aw(l) {
  return this.tween("text", typeof l == "function" ? lw(ah(this, "text", l)) : nw(l == null ? "" : l + ""));
}
function iw(l) {
  return function(i) {
    this.textContent = l.call(this, i);
  };
}
function uw(l) {
  var i, o;
  function r() {
    var s = l.apply(this, arguments);
    return s !== o && (i = (o = s) && iw(s)), i;
  }
  return r._value = l, r;
}
function ow(l) {
  var i = "text";
  if (arguments.length < 1) return (i = this.tween(i)) && i._value;
  if (l == null) return this.tween(i, null);
  if (typeof l != "function") throw new Error();
  return this.tween(i, uw(l));
}
function cw() {
  for (var l = this._name, i = this._id, o = Op(), r = this._groups, s = r.length, f = 0; f < s; ++f)
    for (var d = r[f], g = d.length, S, v = 0; v < g; ++v)
      if (S = d[v]) {
        var y = xn(S, i);
        yr(S, l, o, v, d, {
          time: y.time + y.delay + y.duration,
          delay: 0,
          duration: y.duration,
          ease: y.ease
        });
      }
  return new ul(r, this._parents, l, o);
}
function rw() {
  var l, i, o = this, r = o._id, s = o.size();
  return new Promise(function(f, d) {
    var g = { value: d }, S = { value: function() {
      --s === 0 && f();
    } };
    o.each(function() {
      var v = Ln(this, r), y = v.on;
      y !== l && (i = (l = y).copy(), i._.cancel.push(g), i._.interrupt.push(g), i._.end.push(S)), v.on = i;
    }), s === 0 && f();
  });
}
var sw = 0;
function ul(l, i, o, r) {
  this._groups = l, this._parents = i, this._name = o, this._id = r;
}
function Op() {
  return ++sw;
}
var ll = ku.prototype;
ul.prototype = {
  constructor: ul,
  select: G_,
  selectAll: Q_,
  selectChild: ll.selectChild,
  selectChildren: ll.selectChildren,
  filter: Y_,
  merge: V_,
  selection: $_,
  transition: cw,
  call: ll.call,
  nodes: ll.nodes,
  node: ll.node,
  size: ll.size,
  empty: ll.empty,
  each: ll.each,
  on: X_,
  attr: b_,
  attrTween: T_,
  style: W_,
  styleTween: ew,
  text: aw,
  textTween: ow,
  remove: Z_,
  tween: g_,
  delay: C_,
  duration: D_,
  ease: H_,
  easeVarying: B_,
  end: rw,
  [Symbol.iterator]: ll[Symbol.iterator]
};
var fw = {
  time: null,
  // Set on use.
  delay: 0,
  duration: 250,
  ease: o_
};
function dw(l, i) {
  for (var o; !(o = l.__transition) || !(o = o[i]); )
    if (!(l = l.parentNode))
      throw new Error(`transition ${i} not found`);
  return o;
}
function hw(l) {
  var i, o;
  l instanceof ul ? (i = l._id, l = l._name) : (i = Op(), (o = fw).time = Wd(), l = l == null ? null : l + "");
  for (var r = this._groups, s = r.length, f = 0; f < s; ++f)
    for (var d = r[f], g = d.length, S, v = 0; v < g; ++v)
      (S = d[v]) && yr(S, l, i, v, d, o || dw(S, i));
  return new ul(r, this._parents, l, i);
}
ku.prototype.interrupt = f_;
ku.prototype.transition = hw;
var jc = (l) => () => l;
function gw(l, {
  sourceEvent: i,
  target: o,
  transform: r,
  dispatch: s
}) {
  Object.defineProperties(this, {
    type: { value: l, enumerable: !0, configurable: !0 },
    sourceEvent: { value: i, enumerable: !0, configurable: !0 },
    target: { value: o, enumerable: !0, configurable: !0 },
    transform: { value: r, enumerable: !0, configurable: !0 },
    _: { value: s }
  });
}
function il(l, i, o) {
  this.k = l, this.x = i, this.y = o;
}
il.prototype = {
  constructor: il,
  scale: function(l) {
    return l === 1 ? this : new il(this.k * l, this.x, this.y);
  },
  translate: function(l, i) {
    return l === 0 & i === 0 ? this : new il(this.k, this.x + this.k * l, this.y + this.k * i);
  },
  apply: function(l) {
    return [l[0] * this.k + this.x, l[1] * this.k + this.y];
  },
  applyX: function(l) {
    return l * this.k + this.x;
  },
  applyY: function(l) {
    return l * this.k + this.y;
  },
  invert: function(l) {
    return [(l[0] - this.x) / this.k, (l[1] - this.y) / this.k];
  },
  invertX: function(l) {
    return (l - this.x) / this.k;
  },
  invertY: function(l) {
    return (l - this.y) / this.k;
  },
  rescaleX: function(l) {
    return l.copy().domain(l.range().map(this.invertX, this).map(l.invert, l));
  },
  rescaleY: function(l) {
    return l.copy().domain(l.range().map(this.invertY, this).map(l.invert, l));
  },
  toString: function() {
    return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
  }
};
var vr = new il(1, 0, 0);
Dp.prototype = il.prototype;
function Dp(l) {
  for (; !l.__zoom; ) if (!(l = l.parentNode)) return vr;
  return l.__zoom;
}
function Ed(l) {
  l.stopImmediatePropagation();
}
function Uu(l) {
  l.preventDefault(), l.stopImmediatePropagation();
}
function mw(l) {
  return (!l.ctrlKey || l.type === "wheel") && !l.button;
}
function yw() {
  var l = this;
  return l instanceof SVGElement ? (l = l.ownerSVGElement || l, l.hasAttribute("viewBox") ? (l = l.viewBox.baseVal, [[l.x, l.y], [l.x + l.width, l.y + l.height]]) : [[0, 0], [l.width.baseVal.value, l.height.baseVal.value]]) : [[0, 0], [l.clientWidth, l.clientHeight]];
}
function Py() {
  return this.__zoom || vr;
}
function vw(l) {
  return -l.deltaY * (l.deltaMode === 1 ? 0.05 : l.deltaMode ? 1 : 2e-3) * (l.ctrlKey ? 10 : 1);
}
function pw() {
  return navigator.maxTouchPoints || "ontouchstart" in this;
}
function Sw(l, i, o) {
  var r = l.invertX(i[0][0]) - o[0][0], s = l.invertX(i[1][0]) - o[1][0], f = l.invertY(i[0][1]) - o[0][1], d = l.invertY(i[1][1]) - o[1][1];
  return l.translate(
    s > r ? (r + s) / 2 : Math.min(0, r) || Math.max(0, s),
    d > f ? (f + d) / 2 : Math.min(0, f) || Math.max(0, d)
  );
}
function Rp() {
  var l = mw, i = yw, o = Sw, r = vw, s = pw, f = [0, 1 / 0], d = [[-1 / 0, -1 / 0], [1 / 0, 1 / 0]], g = 250, S = Jc, v = fr("start", "zoom", "end"), y, m, p, b = 500, E = 150, C = 0, N = 10;
  function w(M) {
    M.property("__zoom", Py).on("wheel.zoom", Z, { passive: !1 }).on("mousedown.zoom", J).on("dblclick.zoom", it).filter(s).on("touchstart.zoom", tt).on("touchmove.zoom", ot).on("touchend.zoom touchcancel.zoom", lt).style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
  }
  w.transform = function(M, V, O, H) {
    var X = M.selection ? M.selection() : M;
    X.property("__zoom", Py), M !== X ? j(M, V, O, H) : X.interrupt().each(function() {
      B(this, arguments).event(H).start().zoom(null, typeof V == "function" ? V.apply(this, arguments) : V).end();
    });
  }, w.scaleBy = function(M, V, O, H) {
    w.scaleTo(M, function() {
      var X = this.__zoom.k, K = typeof V == "function" ? V.apply(this, arguments) : V;
      return X * K;
    }, O, H);
  }, w.scaleTo = function(M, V, O, H) {
    w.transform(M, function() {
      var X = i.apply(this, arguments), K = this.__zoom, F = O == null ? A(X) : typeof O == "function" ? O.apply(this, arguments) : O, at = K.invert(F), dt = typeof V == "function" ? V.apply(this, arguments) : V;
      return o(_(U(K, dt), F, at), X, d);
    }, O, H);
  }, w.translateBy = function(M, V, O, H) {
    w.transform(M, function() {
      return o(this.__zoom.translate(
        typeof V == "function" ? V.apply(this, arguments) : V,
        typeof O == "function" ? O.apply(this, arguments) : O
      ), i.apply(this, arguments), d);
    }, null, H);
  }, w.translateTo = function(M, V, O, H, X) {
    w.transform(M, function() {
      var K = i.apply(this, arguments), F = this.__zoom, at = H == null ? A(K) : typeof H == "function" ? H.apply(this, arguments) : H;
      return o(vr.translate(at[0], at[1]).scale(F.k).translate(
        typeof V == "function" ? -V.apply(this, arguments) : -V,
        typeof O == "function" ? -O.apply(this, arguments) : -O
      ), K, d);
    }, H, X);
  };
  function U(M, V) {
    return V = Math.max(f[0], Math.min(f[1], V)), V === M.k ? M : new il(V, M.x, M.y);
  }
  function _(M, V, O) {
    var H = V[0] - O[0] * M.k, X = V[1] - O[1] * M.k;
    return H === M.x && X === M.y ? M : new il(M.k, H, X);
  }
  function A(M) {
    return [(+M[0][0] + +M[1][0]) / 2, (+M[0][1] + +M[1][1]) / 2];
  }
  function j(M, V, O, H) {
    M.on("start.zoom", function() {
      B(this, arguments).event(H).start();
    }).on("interrupt.zoom end.zoom", function() {
      B(this, arguments).event(H).end();
    }).tween("zoom", function() {
      var X = this, K = arguments, F = B(X, K).event(H), at = i.apply(X, K), dt = O == null ? A(at) : typeof O == "function" ? O.apply(X, K) : O, pt = Math.max(at[1][0] - at[0][0], at[1][1] - at[0][1]), T = X.__zoom, k = typeof V == "function" ? V.apply(X, K) : V, st = S(T.invert(dt).concat(pt / T.k), k.invert(dt).concat(pt / k.k));
      return function(ut) {
        if (ut === 1) ut = k;
        else {
          var I = st(ut), ft = pt / I[2];
          ut = new il(ft, dt[0] - I[0] * ft, dt[1] - I[1] * ft);
        }
        F.zoom(null, ut);
      };
    });
  }
  function B(M, V, O) {
    return !O && M.__zooming || new R(M, V);
  }
  function R(M, V) {
    this.that = M, this.args = V, this.active = 0, this.sourceEvent = null, this.extent = i.apply(M, V), this.taps = 0;
  }
  R.prototype = {
    event: function(M) {
      return M && (this.sourceEvent = M), this;
    },
    start: function() {
      return ++this.active === 1 && (this.that.__zooming = this, this.emit("start")), this;
    },
    zoom: function(M, V) {
      return this.mouse && M !== "mouse" && (this.mouse[1] = V.invert(this.mouse[0])), this.touch0 && M !== "touch" && (this.touch0[1] = V.invert(this.touch0[0])), this.touch1 && M !== "touch" && (this.touch1[1] = V.invert(this.touch1[0])), this.that.__zoom = V, this.emit("zoom"), this;
    },
    end: function() {
      return --this.active === 0 && (delete this.that.__zooming, this.emit("end")), this;
    },
    emit: function(M) {
      var V = $e(this.that).datum();
      v.call(
        M,
        this.that,
        new gw(M, {
          sourceEvent: this.sourceEvent,
          target: w,
          transform: this.that.__zoom,
          dispatch: v
        }),
        V
      );
    }
  };
  function Z(M, ...V) {
    if (!l.apply(this, arguments)) return;
    var O = B(this, V).event(M), H = this.__zoom, X = Math.max(f[0], Math.min(f[1], H.k * Math.pow(2, r.apply(this, arguments)))), K = mn(M);
    if (O.wheel)
      (O.mouse[0][0] !== K[0] || O.mouse[0][1] !== K[1]) && (O.mouse[1] = H.invert(O.mouse[0] = K)), clearTimeout(O.wheel);
    else {
      if (H.k === X) return;
      O.mouse = [K, H.invert(K)], Fc(this), O.start();
    }
    Uu(M), O.wheel = setTimeout(F, E), O.zoom("mouse", o(_(U(H, X), O.mouse[0], O.mouse[1]), O.extent, d));
    function F() {
      O.wheel = null, O.end();
    }
  }
  function J(M, ...V) {
    if (p || !l.apply(this, arguments)) return;
    var O = M.currentTarget, H = B(this, V, !0).event(M), X = $e(M.view).on("mousemove.zoom", dt, !0).on("mouseup.zoom", pt, !0), K = mn(M, O), F = M.clientX, at = M.clientY;
    up(M.view), Ed(M), H.mouse = [K, this.__zoom.invert(K)], Fc(this), H.start();
    function dt(T) {
      if (Uu(T), !H.moved) {
        var k = T.clientX - F, st = T.clientY - at;
        H.moved = k * k + st * st > C;
      }
      H.event(T).zoom("mouse", o(_(H.that.__zoom, H.mouse[0] = mn(T, O), H.mouse[1]), H.extent, d));
    }
    function pt(T) {
      X.on("mousemove.zoom mouseup.zoom", null), op(T.view, H.moved), Uu(T), H.event(T).end();
    }
  }
  function it(M, ...V) {
    if (l.apply(this, arguments)) {
      var O = this.__zoom, H = mn(M.changedTouches ? M.changedTouches[0] : M, this), X = O.invert(H), K = O.k * (M.shiftKey ? 0.5 : 2), F = o(_(U(O, K), H, X), i.apply(this, V), d);
      Uu(M), g > 0 ? $e(this).transition().duration(g).call(j, F, H, M) : $e(this).call(w.transform, F, H, M);
    }
  }
  function tt(M, ...V) {
    if (l.apply(this, arguments)) {
      var O = M.touches, H = O.length, X = B(this, V, M.changedTouches.length === H).event(M), K, F, at, dt;
      for (Ed(M), F = 0; F < H; ++F)
        at = O[F], dt = mn(at, this), dt = [dt, this.__zoom.invert(dt), at.identifier], X.touch0 ? !X.touch1 && X.touch0[2] !== dt[2] && (X.touch1 = dt, X.taps = 0) : (X.touch0 = dt, K = !0, X.taps = 1 + !!y);
      y && (y = clearTimeout(y)), K && (X.taps < 2 && (m = dt[0], y = setTimeout(function() {
        y = null;
      }, b)), Fc(this), X.start());
    }
  }
  function ot(M, ...V) {
    if (this.__zooming) {
      var O = B(this, V).event(M), H = M.changedTouches, X = H.length, K, F, at, dt;
      for (Uu(M), K = 0; K < X; ++K)
        F = H[K], at = mn(F, this), O.touch0 && O.touch0[2] === F.identifier ? O.touch0[0] = at : O.touch1 && O.touch1[2] === F.identifier && (O.touch1[0] = at);
      if (F = O.that.__zoom, O.touch1) {
        var pt = O.touch0[0], T = O.touch0[1], k = O.touch1[0], st = O.touch1[1], ut = (ut = k[0] - pt[0]) * ut + (ut = k[1] - pt[1]) * ut, I = (I = st[0] - T[0]) * I + (I = st[1] - T[1]) * I;
        F = U(F, Math.sqrt(ut / I)), at = [(pt[0] + k[0]) / 2, (pt[1] + k[1]) / 2], dt = [(T[0] + st[0]) / 2, (T[1] + st[1]) / 2];
      } else if (O.touch0) at = O.touch0[0], dt = O.touch0[1];
      else return;
      O.zoom("touch", o(_(F, at, dt), O.extent, d));
    }
  }
  function lt(M, ...V) {
    if (this.__zooming) {
      var O = B(this, V).event(M), H = M.changedTouches, X = H.length, K, F;
      for (Ed(M), p && clearTimeout(p), p = setTimeout(function() {
        p = null;
      }, b), K = 0; K < X; ++K)
        F = H[K], O.touch0 && O.touch0[2] === F.identifier ? delete O.touch0 : O.touch1 && O.touch1[2] === F.identifier && delete O.touch1;
      if (O.touch1 && !O.touch0 && (O.touch0 = O.touch1, delete O.touch1), O.touch0) O.touch0[1] = this.__zoom.invert(O.touch0[0]);
      else if (O.end(), O.taps === 2 && (F = mn(F, this), Math.hypot(m[0] - F[0], m[1] - F[1]) < N)) {
        var at = $e(this).on("dblclick.zoom");
        at && at.apply(this, arguments);
      }
    }
  }
  return w.wheelDelta = function(M) {
    return arguments.length ? (r = typeof M == "function" ? M : jc(+M), w) : r;
  }, w.filter = function(M) {
    return arguments.length ? (l = typeof M == "function" ? M : jc(!!M), w) : l;
  }, w.touchable = function(M) {
    return arguments.length ? (s = typeof M == "function" ? M : jc(!!M), w) : s;
  }, w.extent = function(M) {
    return arguments.length ? (i = typeof M == "function" ? M : jc([[+M[0][0], +M[0][1]], [+M[1][0], +M[1][1]]]), w) : i;
  }, w.scaleExtent = function(M) {
    return arguments.length ? (f[0] = +M[0], f[1] = +M[1], w) : [f[0], f[1]];
  }, w.translateExtent = function(M) {
    return arguments.length ? (d[0][0] = +M[0][0], d[1][0] = +M[1][0], d[0][1] = +M[0][1], d[1][1] = +M[1][1], w) : [[d[0][0], d[0][1]], [d[1][0], d[1][1]]];
  }, w.constrain = function(M) {
    return arguments.length ? (o = M, w) : o;
  }, w.duration = function(M) {
    return arguments.length ? (g = +M, w) : g;
  }, w.interpolate = function(M) {
    return arguments.length ? (S = M, w) : S;
  }, w.on = function() {
    var M = v.on.apply(v, arguments);
    return M === v ? w : M;
  }, w.clickDistance = function(M) {
    return arguments.length ? (C = (M = +M) * M, w) : Math.sqrt(C);
  }, w.tapDistance = function(M) {
    return arguments.length ? (N = +M, w) : N;
  }, w;
}
const Sn = {
  error001: (l = "react") => `Seems like you have not used ${l === "svelte" ? "SvelteFlowProvider" : "ReactFlowProvider"} as an ancestor. Help: https://${l}flow.dev/error#001`,
  error002: () => "It looks like you've created a new nodeTypes or edgeTypes object. If this wasn't on purpose please define the nodeTypes/edgeTypes outside of the component or memoize them.",
  error003: (l) => `Node type "${l}" not found. Using fallback type "default".`,
  error004: () => "The parent container needs a width and a height to render the graph.",
  error005: () => "Only child nodes can use a parent extent.",
  error006: () => "Can't create edge. An edge needs a source and a target.",
  error007: (l) => `The old edge with id=${l} does not exist.`,
  error009: (l) => `Marker type "${l}" doesn't exist.`,
  error008: (l, { id: i, sourceHandle: o, targetHandle: r }) => `Couldn't create edge for ${l} handle id: "${l === "source" ? o : r}", edge id: ${i}.`,
  error010: () => "Handle: No node id found. Make sure to only use a Handle inside a custom Node.",
  error011: (l) => `Edge type "${l}" not found. Using fallback type "default".`,
  error012: (l) => `Node with id "${l}" does not exist, it may have been removed. This can happen when a node is deleted before the "onNodeClick" handler is called.`,
  error013: (l = "react") => `It seems that you haven't loaded the styles. Please import '@xyflow/${l}/dist/style.css' or base.css to make sure everything is working properly.`,
  error014: () => "useNodeConnections: No node ID found. Call useNodeConnections inside a custom Node or provide a node ID.",
  error015: () => "It seems that you are trying to drag a node that is not initialized. Please use onNodesChange as explained in the docs.",
  error016: (l) => `Edge with id "${l}" does not exist, it may have been removed. This can happen when an edge is deleted before the "onEdgeClick" handler is called.`
}, Gu = [
  [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY],
  [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY]
], Hp = ["Enter", " ", "Escape"], Up = {
  "node.a11yDescription.default": "Press enter or space to select a node. Press delete to remove it and escape to cancel.",
  "node.a11yDescription.keyboardDisabled": "Press enter or space to select a node. You can then use the arrow keys to move the node around. Press delete to remove it and escape to cancel.",
  "node.a11yDescription.ariaLiveMessage": ({ direction: l, x: i, y: o }) => `Moved selected node ${l}. New position, x: ${i}, y: ${o}`,
  "edge.a11yDescription.default": "Press enter or space to select an edge. You can then press delete to remove it or escape to cancel.",
  // Control elements
  "controls.ariaLabel": "Control Panel",
  "controls.zoomIn.ariaLabel": "Zoom In",
  "controls.zoomOut.ariaLabel": "Zoom Out",
  "controls.fitView.ariaLabel": "Fit View",
  "controls.interactive.ariaLabel": "Toggle Interactivity",
  // Mini map
  "minimap.ariaLabel": "Mini Map",
  // Handle
  "handle.ariaLabel": "Handle"
};
var Ci;
(function(l) {
  l.Strict = "strict", l.Loose = "loose";
})(Ci || (Ci = {}));
var pa;
(function(l) {
  l.Free = "free", l.Vertical = "vertical", l.Horizontal = "horizontal";
})(pa || (pa = {}));
var Qu;
(function(l) {
  l.Partial = "partial", l.Full = "full";
})(Qu || (Qu = {}));
const Bp = {
  inProgress: !1,
  isValid: null,
  from: null,
  fromHandle: null,
  fromPosition: null,
  fromNode: null,
  to: null,
  toHandle: null,
  toPosition: null,
  toNode: null,
  pointer: null
};
var Ll;
(function(l) {
  l.Bezier = "default", l.Straight = "straight", l.Step = "step", l.SmoothStep = "smoothstep", l.SimpleBezier = "simplebezier";
})(Ll || (Ll = {}));
var ur;
(function(l) {
  l.Arrow = "arrow", l.ArrowClosed = "arrowclosed";
})(ur || (ur = {}));
var xt;
(function(l) {
  l.Left = "left", l.Top = "top", l.Right = "right", l.Bottom = "bottom";
})(xt || (xt = {}));
const tv = {
  [xt.Left]: xt.Right,
  [xt.Right]: xt.Left,
  [xt.Top]: xt.Bottom,
  [xt.Bottom]: xt.Top
}, Yp = (l) => !!l && typeof l == "object" && "id" in l && "source" in l && "target" in l, xw = (l) => !!l && typeof l == "object" && "id" in l && "position" in l && !("source" in l) && !("target" in l), ih = (l) => !!l && typeof l == "object" && "id" in l && "internals" in l && !("source" in l) && !("target" in l), Wu = (l, i = [0, 0]) => {
  const { width: o, height: r } = bn(l), s = l.origin ?? i, f = o * s[0], d = r * s[1];
  return {
    x: l.position.x - f,
    y: l.position.y - d
  };
}, bw = (l, i = { nodeOrigin: [0, 0] }) => {
  if (l.length === 0)
    return { x: 0, y: 0, width: 0, height: 0 };
  let o = !1;
  const r = l.reduce((s, f) => {
    const d = typeof f == "string";
    let g = !i.nodeLookup && !d ? f : void 0;
    return i.nodeLookup && (g = d ? i.nodeLookup.get(f) : ih(f) ? f : i.nodeLookup.get(f.id)), g ? (o = !0, pr(s, or(g, i.nodeOrigin))) : s;
  }, { x: 1 / 0, y: 1 / 0, x2: -1 / 0, y2: -1 / 0 });
  return o ? Sr(r) : { x: 0, y: 0, width: 0, height: 0 };
}, Pu = (l, i = {}) => {
  let o = { x: 1 / 0, y: 1 / 0, x2: -1 / 0, y2: -1 / 0 }, r = !1;
  return l.forEach((s) => {
    (i.filter === void 0 || i.filter(s)) && (o = pr(o, or(s)), r = !0);
  }), r ? Sr(o) : { x: 0, y: 0, width: 0, height: 0 };
}, uh = (l, i, [o, r, s] = [0, 0, 1], f = !1, d = !1) => {
  const g = (i.x - o) / s, S = (i.y - r) / s, v = i.width / s, y = i.height / s, m = [];
  for (const p of l.values()) {
    const { measured: b, selectable: E = !0, hidden: C = !1 } = p;
    if (d && !E || C)
      continue;
    const N = b.width ?? p.width ?? p.initialWidth ?? 0, w = b.height ?? p.height ?? p.initialHeight ?? 0, { x: U, y: _ } = p.internals.positionAbsolute, A = Xp(g, S, v, y, U, _, N, w), j = N * w, B = f && A > 0;
    (!p.internals.handleBounds || B || A >= j || p.dragging) && m.push(p);
  }
  return m;
}, Ew = (l, i) => {
  const o = /* @__PURE__ */ new Set();
  return l.forEach((r) => {
    o.add(r.id);
  }), i.filter((r) => o.has(r.source) || o.has(r.target));
};
function _w(l, i) {
  const o = /* @__PURE__ */ new Map(), r = i?.nodes ? new Set(i.nodes.map((s) => s.id)) : null;
  return l.forEach((s) => {
    let f;
    if (i?.includeHiddenNodes) {
      const { width: d, height: g } = bn(s);
      f = d > 0 && g > 0;
    } else
      f = !!(s.measured.width && s.measured.height && !s.hidden);
    f && (!r || r.has(s.id)) && o.set(s.id, s);
  }), o;
}
async function ww({ nodes: l, width: i, height: o, panZoom: r, minZoom: s, maxZoom: f }, d) {
  if (l.size === 0)
    return !0;
  const g = _w(l, d), S = Pu(g), v = ch(S, i, o, d?.minZoom ?? s, d?.maxZoom ?? f, d?.padding ?? 0.1);
  return await r.setViewport(v, {
    duration: d?.duration,
    ease: d?.ease,
    interpolate: d?.interpolate
  }), !0;
}
function Vp({ nodeId: l, nextPosition: i, nodeLookup: o, nodeOrigin: r = [0, 0], nodeExtent: s, onError: f }) {
  const d = o.get(l), g = d.parentId ? o.get(d.parentId) : void 0, { x: S, y: v } = g ? g.internals.positionAbsolute : { x: 0, y: 0 }, y = d.origin ?? r;
  let m = d.extent || s;
  if (d.extent === "parent" && !d.expandParent)
    if (!g)
      f?.("005", Sn.error005());
    else {
      const { width: b, height: E } = bn(g);
      b && E && (m = [
        [S, v],
        [S + b, v + E]
      ]);
    }
  else g && _a(d.extent) && (m = [
    [d.extent[0][0] + S, d.extent[0][1] + v],
    [d.extent[1][0] + S, d.extent[1][1] + v]
  ]);
  const p = _a(m) ? Ea(i, m, d.measured) : i;
  return (d.measured.width === void 0 || d.measured.height === void 0) && f?.("015", Sn.error015()), {
    position: {
      x: p.x - S + (d.measured.width ?? 0) * y[0],
      y: p.y - v + (d.measured.height ?? 0) * y[1]
    },
    positionAbsolute: p
  };
}
async function Nw({ nodesToRemove: l = [], edgesToRemove: i = [], nodes: o, edges: r, onBeforeDelete: s }) {
  const f = new Set(l.map((p) => p.id)), d = [];
  for (const p of o) {
    if (p.deletable === !1)
      continue;
    const b = f.has(p.id), E = !b && p.parentId && d.find((C) => C.id === p.parentId);
    (b || E) && d.push(p);
  }
  const g = new Set(i.map((p) => p.id)), S = r.filter((p) => p.deletable !== !1), y = Ew(d, S);
  for (const p of S)
    g.has(p.id) && !y.find((E) => E.id === p.id) && y.push(p);
  if (!s)
    return {
      edges: y,
      nodes: d
    };
  const m = await s({
    nodes: d,
    edges: y
  });
  return typeof m == "boolean" ? m ? { edges: y, nodes: d } : { edges: [], nodes: [] } : m;
}
const Ai = (l, i = 0, o = 1) => Math.min(Math.max(l, i), o), Ea = (l = { x: 0, y: 0 }, i, o) => ({
  x: Ai(l.x, i[0][0], i[1][0] - (o?.width ?? 0)),
  y: Ai(l.y, i[0][1], i[1][1] - (o?.height ?? 0))
});
function Lp(l, i, o) {
  const { width: r, height: s } = bn(o), { x: f, y: d } = o.internals.positionAbsolute;
  return Ea(l, [
    [f, d],
    [f + r, d + s]
  ], i);
}
const ev = (l, i, o) => l < i ? Ai(Math.abs(l - i), 1, i) / i : l > o ? -Ai(Math.abs(l - o), 1, i) / i : 0, oh = (l, i, o = 15, r = 40) => {
  const s = ev(l.x, r, i.width - r) * o, f = ev(l.y, r, i.height - r) * o;
  return [s, f];
}, pr = (l, i) => ({
  x: Math.min(l.x, i.x),
  y: Math.min(l.y, i.y),
  x2: Math.max(l.x2, i.x2),
  y2: Math.max(l.y2, i.y2)
}), Xd = ({ x: l, y: i, width: o, height: r }) => ({
  x: l,
  y: i,
  x2: l + o,
  y2: i + r
}), Sr = ({ x: l, y: i, x2: o, y2: r }) => ({
  x: l,
  y: i,
  width: o - l,
  height: r - i
}), Ku = (l, i = [0, 0]) => {
  const { x: o, y: r } = ih(l) ? l.internals.positionAbsolute : Wu(l, i);
  return {
    x: o,
    y: r,
    width: l.measured?.width ?? l.width ?? l.initialWidth ?? 0,
    height: l.measured?.height ?? l.height ?? l.initialHeight ?? 0
  };
}, or = (l, i = [0, 0]) => {
  const { x: o, y: r } = ih(l) ? l.internals.positionAbsolute : Wu(l, i);
  return {
    x: o,
    y: r,
    x2: o + (l.measured?.width ?? l.width ?? l.initialWidth ?? 0),
    y2: r + (l.measured?.height ?? l.height ?? l.initialHeight ?? 0)
  };
}, qp = (l, i) => Sr(pr(Xd(l), Xd(i))), Xp = (l, i, o, r, s, f, d, g) => {
  const S = Math.max(0, Math.min(l + o, s + d) - Math.max(l, s)), v = Math.max(0, Math.min(i + r, f + g) - Math.max(i, f));
  return Math.ceil(S * v);
}, cr = (l, i) => Xp(l.x, l.y, l.width, l.height, i.x, i.y, i.width, i.height), nv = (l) => vn(l.width) && vn(l.height) && vn(l.x) && vn(l.y), vn = (l) => !isNaN(l) && isFinite(l), jp = (l, i) => (o, r) => {
}, to = (l, i = [1, 1]) => ({
  x: i[0] * Math.round(l.x / i[0]),
  y: i[1] * Math.round(l.y / i[1])
}), eo = ({ x: l, y: i }, [o, r, s], f = !1, d = [1, 1]) => {
  const g = {
    x: (l - o) / s,
    y: (i - r) / s
  };
  return f ? to(g, d) : g;
}, Oi = ({ x: l, y: i }, [o, r, s]) => ({
  x: l * s + o,
  y: i * s + r
});
function pi(l, i) {
  if (typeof l == "number")
    return Math.floor((i - i / (1 + l)) * 0.5);
  if (typeof l == "string" && l.endsWith("px")) {
    const o = parseFloat(l);
    if (!Number.isNaN(o))
      return Math.floor(o);
  }
  if (typeof l == "string" && l.endsWith("%")) {
    const o = parseFloat(l);
    if (!Number.isNaN(o))
      return Math.floor(i * o * 0.01);
  }
  return console.error(`The padding value "${l}" is invalid. Please provide a number or a string with a valid unit (px or %).`), 0;
}
function Tw(l, i, o) {
  if (typeof l == "string" || typeof l == "number") {
    const r = pi(l, o), s = pi(l, i);
    return {
      top: r,
      right: s,
      bottom: r,
      left: s,
      x: s * 2,
      y: r * 2
    };
  }
  if (typeof l == "object") {
    const r = pi(l.top ?? l.y ?? 0, o), s = pi(l.bottom ?? l.y ?? 0, o), f = pi(l.left ?? l.x ?? 0, i), d = pi(l.right ?? l.x ?? 0, i);
    return { top: r, right: d, bottom: s, left: f, x: f + d, y: r + s };
  }
  return { top: 0, right: 0, bottom: 0, left: 0, x: 0, y: 0 };
}
function Mw(l, i, o, r, s, f) {
  const { x: d, y: g } = Oi(l, [i, o, r]), { x: S, y: v } = Oi({ x: l.x + l.width, y: l.y + l.height }, [i, o, r]), y = s - S, m = f - v;
  return {
    left: Math.floor(d),
    top: Math.floor(g),
    right: Math.floor(y),
    bottom: Math.floor(m)
  };
}
const ch = (l, i, o, r, s, f) => {
  const d = Tw(f, i, o), g = (i - d.x) / l.width, S = (o - d.y) / l.height, v = Math.min(g, S), y = Ai(v, r, s), m = l.x + l.width / 2, p = l.y + l.height / 2, b = i / 2 - m * y, E = o / 2 - p * y, C = Mw(l, b, E, y, i, o), N = {
    left: Math.min(C.left - d.left, 0),
    top: Math.min(C.top - d.top, 0),
    right: Math.min(C.right - d.right, 0),
    bottom: Math.min(C.bottom - d.bottom, 0)
  };
  return {
    x: b - N.left + N.right,
    y: E - N.top + N.bottom,
    zoom: y
  };
}, $u = () => typeof navigator < "u" && navigator?.userAgent?.indexOf("Mac") >= 0;
function _a(l) {
  return l != null && l !== "parent";
}
function bn(l) {
  return {
    width: l.measured?.width ?? l.width ?? l.initialWidth ?? 0,
    height: l.measured?.height ?? l.height ?? l.initialHeight ?? 0
  };
}
function Zp(l) {
  return (l.measured?.width ?? l.width ?? l.initialWidth) !== void 0 && (l.measured?.height ?? l.height ?? l.initialHeight) !== void 0;
}
function Gp(l, i = { width: 0, height: 0 }, o, r, s) {
  const f = { ...l }, d = r.get(o);
  if (d) {
    const g = d.origin || s;
    f.x += d.internals.positionAbsolute.x - (i.width ?? 0) * g[0], f.y += d.internals.positionAbsolute.y - (i.height ?? 0) * g[1];
  }
  return f;
}
function lv(l, i) {
  if (l.size !== i.size)
    return !1;
  for (const o of l)
    if (!i.has(o))
      return !1;
  return !0;
}
function zw() {
  let l, i;
  return { promise: new Promise((r, s) => {
    l = r, i = s;
  }), resolve: l, reject: i };
}
function Cw(l) {
  return { ...Up, ...l || {} };
}
function Qp(l) {
  return l === null ? null : l ? "valid" : "invalid";
}
function Lu(l, { snapGrid: i = [0, 0], snapToGrid: o = !1, transform: r, containerBounds: s }) {
  const { x: f, y: d } = pn(l), g = eo({ x: f - (s?.left ?? 0), y: d - (s?.top ?? 0) }, r), { x: S, y: v } = o ? to(g, i) : g;
  return {
    xSnapped: S,
    ySnapped: v,
    ...g
  };
}
const rh = (l) => ({
  width: l.offsetWidth,
  height: l.offsetHeight
}), Kp = (l) => l?.getRootNode?.() || window?.document, Aw = ["INPUT", "SELECT", "TEXTAREA"];
function $p(l) {
  const i = l.composedPath?.()?.[0] || l.target;
  return i?.nodeType !== 1 ? !1 : Aw.includes(i.nodeName) || i.hasAttribute("contenteditable") || !!i.closest(".nokey");
}
const Jp = (l) => "clientX" in l, pn = (l, i) => {
  const o = Jp(l), r = o ? l.clientX : l.touches?.[0].clientX, s = o ? l.clientY : l.touches?.[0].clientY;
  return {
    x: r - (i?.left ?? 0),
    y: s - (i?.top ?? 0)
  };
}, av = (l, i, o, r, s) => {
  const f = i.querySelectorAll(`.${l}`);
  return !f || !f.length ? null : Array.from(f).map((d) => {
    const g = d.getBoundingClientRect();
    return {
      id: d.getAttribute("data-handleid"),
      type: l,
      nodeId: s,
      position: d.getAttribute("data-handlepos"),
      x: (g.left - o.left) / r,
      y: (g.top - o.top) / r,
      ...rh(d)
    };
  });
};
function Ip({ sourceX: l, sourceY: i, targetX: o, targetY: r, sourceControlX: s, sourceControlY: f, targetControlX: d, targetControlY: g }) {
  const S = l * 0.125 + s * 0.375 + d * 0.375 + o * 0.125, v = i * 0.125 + f * 0.375 + g * 0.375 + r * 0.125, y = Math.abs(S - l), m = Math.abs(v - i);
  return [S, v, y, m];
}
function Zc(l, i) {
  return l >= 0 ? 0.5 * l : i * 25 * Math.sqrt(-l);
}
function iv({ pos: l, x1: i, y1: o, x2: r, y2: s, c: f }) {
  switch (l) {
    case xt.Left:
      return [i - Zc(i - r, f), o];
    case xt.Right:
      return [i + Zc(r - i, f), o];
    case xt.Top:
      return [i, o - Zc(o - s, f)];
    case xt.Bottom:
      return [i, o + Zc(s - o, f)];
  }
}
function kp({ sourceX: l, sourceY: i, sourcePosition: o = xt.Bottom, targetX: r, targetY: s, targetPosition: f = xt.Top, curvature: d = 0.25 }) {
  const [g, S] = iv({
    pos: o,
    x1: l,
    y1: i,
    x2: r,
    y2: s,
    c: d
  }), [v, y] = iv({
    pos: f,
    x1: r,
    y1: s,
    x2: l,
    y2: i,
    c: d
  }), [m, p, b, E] = Ip({
    sourceX: l,
    sourceY: i,
    targetX: r,
    targetY: s,
    sourceControlX: g,
    sourceControlY: S,
    targetControlX: v,
    targetControlY: y
  });
  return [
    `M${l},${i} C${g},${S} ${v},${y} ${r},${s}`,
    m,
    p,
    b,
    E
  ];
}
function Fp({ sourceX: l, sourceY: i, targetX: o, targetY: r }) {
  const s = Math.abs(o - l) / 2, f = o < l ? o + s : o - s, d = Math.abs(r - i) / 2, g = r < i ? r + d : r - d;
  return [f, g, s, d];
}
function Ow({ sourceNode: l, targetNode: i, selected: o = !1, zIndex: r = 0, elevateOnSelect: s = !1, zIndexMode: f = "basic" }) {
  if (f === "manual")
    return r;
  const d = s && o ? r + 1e3 : r, g = Math.max(l.parentId || s && l.selected ? l.internals.z : 0, i.parentId || s && i.selected ? i.internals.z : 0);
  return d + g;
}
function Dw({ sourceNode: l, targetNode: i, width: o, height: r, transform: s }) {
  const f = pr(or(l), or(i));
  f.x === f.x2 && (f.x2 += 1), f.y === f.y2 && (f.y2 += 1);
  const d = {
    x: -s[0] / s[2],
    y: -s[1] / s[2],
    width: o / s[2],
    height: r / s[2]
  };
  return cr(d, Sr(f)) > 0;
}
const Rw = ({ source: l, sourceHandle: i, target: o, targetHandle: r }) => `xy-edge__${l}${i || ""}-${o}${r || ""}`, Hw = (l, i) => i.some((o) => o.source === l.source && o.target === l.target && (o.sourceHandle === l.sourceHandle || !o.sourceHandle && !l.sourceHandle) && (o.targetHandle === l.targetHandle || !o.targetHandle && !l.targetHandle)), Uw = (l, i, o = {}) => {
  if (!l.source || !l.target)
    return o.onError?.("006", Sn.error006()), i;
  const r = o.getEdgeId || Rw;
  let s;
  return Yp(l) ? s = { ...l } : s = {
    ...l,
    id: r(l)
  }, Hw(s, i) ? i : (s.sourceHandle === null && delete s.sourceHandle, s.targetHandle === null && delete s.targetHandle, i.concat(s));
};
function Wp({ sourceX: l, sourceY: i, targetX: o, targetY: r }) {
  const [s, f, d, g] = Fp({
    sourceX: l,
    sourceY: i,
    targetX: o,
    targetY: r
  });
  return [`M ${l},${i}L ${o},${r}`, s, f, d, g];
}
const uv = {
  [xt.Left]: { x: -1, y: 0 },
  [xt.Right]: { x: 1, y: 0 },
  [xt.Top]: { x: 0, y: -1 },
  [xt.Bottom]: { x: 0, y: 1 }
}, Bw = ({ source: l, sourcePosition: i = xt.Bottom, target: o }) => i === xt.Left || i === xt.Right ? l.x < o.x ? { x: 1, y: 0 } : { x: -1, y: 0 } : l.y < o.y ? { x: 0, y: 1 } : { x: 0, y: -1 }, ov = (l, i) => Math.sqrt(Math.pow(i.x - l.x, 2) + Math.pow(i.y - l.y, 2)), Yw = (l, i, o) => l.x === i.x && i.x === o.x && (i.y - l.y) * (o.y - i.y) >= 0 || l.y === i.y && i.y === o.y && (i.x - l.x) * (o.x - i.x) >= 0;
function Vw({ source: l, sourcePosition: i = xt.Bottom, target: o, targetPosition: r = xt.Top, center: s, offset: f, stepPosition: d }) {
  const g = uv[i], S = uv[r], v = { x: l.x + g.x * f, y: l.y + g.y * f }, y = { x: o.x + S.x * f, y: o.y + S.y * f }, m = Bw({
    source: v,
    sourcePosition: i,
    target: y
  }), p = m.x !== 0 ? "x" : "y", b = m[p];
  let E = [], C, N;
  const w = { x: 0, y: 0 }, U = { x: 0, y: 0 }, [, , _, A] = Fp({
    sourceX: l.x,
    sourceY: l.y,
    targetX: o.x,
    targetY: o.y
  });
  if (g[p] * S[p] === -1) {
    p === "x" ? (C = s.x ?? v.x + (y.x - v.x) * d, N = s.y ?? (v.y + y.y) / 2) : (C = s.x ?? (v.x + y.x) / 2, N = s.y ?? v.y + (y.y - v.y) * d);
    const Z = [
      { x: C, y: v.y },
      { x: C, y: y.y }
    ], J = [
      { x: v.x, y: N },
      { x: y.x, y: N }
    ];
    g[p] === b ? E = p === "x" ? Z : J : E = p === "x" ? J : Z;
  } else {
    const Z = [{ x: v.x, y: y.y }], J = [{ x: y.x, y: v.y }];
    if (p === "x" ? E = g.x === b ? J : Z : E = g.y === b ? Z : J, i === r) {
      const M = Math.abs(l[p] - o[p]);
      if (M <= f) {
        const V = Math.min(f - 1, f - M);
        g[p] === b ? w[p] = (v[p] > l[p] ? -1 : 1) * V : U[p] = (y[p] > o[p] ? -1 : 1) * V;
      }
    }
    if (i !== r) {
      const M = p === "x" ? "y" : "x", V = g[p] === S[M], O = v[M] > y[M], H = v[M] < y[M];
      (g[p] === 1 && (!V && O || V && H) || g[p] !== 1 && (!V && H || V && O)) && (E = p === "x" ? Z : J);
    }
    const it = { x: v.x + w.x, y: v.y + w.y }, tt = { x: y.x + U.x, y: y.y + U.y }, ot = Math.max(Math.abs(it.x - E[0].x), Math.abs(tt.x - E[0].x)), lt = Math.max(Math.abs(it.y - E[0].y), Math.abs(tt.y - E[0].y));
    ot >= lt ? (C = (it.x + tt.x) / 2, N = E[0].y) : (C = E[0].x, N = (it.y + tt.y) / 2);
  }
  const j = { x: v.x + w.x, y: v.y + w.y }, B = { x: y.x + U.x, y: y.y + U.y }, R = [];
  for (const Z of [l, j, ...E, B, o]) {
    const [J, it] = R.slice(-2);
    it && Yw(J, it, Z) && R.pop(), R.push(Z);
  }
  return [R, C, N, _, A];
}
function Lw(l, i, o, r) {
  const s = Math.min(ov(l, i) / 2, ov(i, o) / 2, r), { x: f, y: d } = i;
  if (l.x === f && f === o.x || l.y === d && d === o.y)
    return `L${f} ${d}`;
  if (l.y === d) {
    const v = l.x < o.x ? -1 : 1, y = l.y < o.y ? 1 : -1;
    return `L ${f + s * v},${d}Q ${f},${d} ${f},${d + s * y}`;
  }
  const g = l.x < o.x ? 1 : -1, S = l.y < o.y ? -1 : 1;
  return `L ${f},${d + s * S}Q ${f},${d} ${f + s * g},${d}`;
}
function jd({ sourceX: l, sourceY: i, sourcePosition: o = xt.Bottom, targetX: r, targetY: s, targetPosition: f = xt.Top, borderRadius: d = 5, centerX: g, centerY: S, offset: v = 20, stepPosition: y = 0.5 }) {
  const [m, p, b, E, C] = Vw({
    source: { x: l, y: i },
    sourcePosition: o,
    target: { x: r, y: s },
    targetPosition: f,
    center: { x: g, y: S },
    offset: v,
    stepPosition: y
  });
  let N = `M${m[0].x} ${m[0].y}`;
  for (let w = 1; w < m.length - 1; w++)
    N += Lw(m[w - 1], m[w], m[w + 1], d);
  return N += `L${m[m.length - 1].x} ${m[m.length - 1].y}`, [N, p, b, E, C];
}
function cv(l) {
  return l && !!(l.internals.handleBounds || l.handles?.length) && !!(l.measured.width || l.width || l.initialWidth);
}
function qw(l) {
  const { sourceNode: i, targetNode: o } = l;
  if (!cv(i) || !cv(o))
    return null;
  const r = i.internals.handleBounds || rv(i.handles), s = o.internals.handleBounds || rv(o.handles), f = sv(r?.source ?? [], l.sourceHandle), d = sv(
    // when connection type is loose we can define all handles as sources and connect source -> source
    l.connectionMode === Ci.Strict ? s?.target ?? [] : (s?.target ?? []).concat(s?.source ?? []),
    l.targetHandle
  );
  if (!f || !d)
    return l.onError?.("008", Sn.error008(f ? "target" : "source", {
      id: l.id,
      sourceHandle: l.sourceHandle,
      targetHandle: l.targetHandle
    })), null;
  const g = f?.position || xt.Bottom, S = d?.position || xt.Top, v = wa(i, f, g), y = wa(o, d, S);
  return {
    sourceX: v.x,
    sourceY: v.y,
    targetX: y.x,
    targetY: y.y,
    sourcePosition: g,
    targetPosition: S
  };
}
function rv(l) {
  if (!l)
    return null;
  const i = [], o = [];
  for (const r of l)
    r.width = r.width ?? 1, r.height = r.height ?? 1, r.type === "source" ? i.push(r) : r.type === "target" && o.push(r);
  return {
    source: i,
    target: o
  };
}
function wa(l, i, o = xt.Left, r = !1) {
  const s = (i?.x ?? 0) + l.internals.positionAbsolute.x, f = (i?.y ?? 0) + l.internals.positionAbsolute.y, { width: d, height: g } = i ?? bn(l);
  if (r)
    return { x: s + d / 2, y: f + g / 2 };
  switch (i?.position ?? o) {
    case xt.Top:
      return { x: s + d / 2, y: f };
    case xt.Right:
      return { x: s + d, y: f + g / 2 };
    case xt.Bottom:
      return { x: s + d / 2, y: f + g };
    case xt.Left:
      return { x: s, y: f + g / 2 };
  }
}
function sv(l, i) {
  return l && (i ? l.find((o) => o.id === i) : l[0]) || null;
}
function Zd(l, i) {
  return l ? typeof l == "string" ? l : `${i ? `${i}__` : ""}${Object.keys(l).sort().map((r) => `${r}=${l[r]}`).join("&")}` : "";
}
function Xw(l, { id: i, defaultColor: o, defaultMarkerStart: r, defaultMarkerEnd: s }) {
  const f = /* @__PURE__ */ new Set();
  return l.reduce((d, g) => ([g.markerStart || r, g.markerEnd || s].forEach((S) => {
    if (S && typeof S == "object") {
      const v = Zd(S, i);
      f.has(v) || (d.push({ id: v, color: S.color || o, ...S }), f.add(v));
    }
  }), d), []).sort((d, g) => d.id.localeCompare(g.id));
}
const Pp = 1e3, jw = 10, sh = {
  nodeOrigin: [0, 0],
  nodeExtent: Gu,
  elevateNodesOnSelect: !0,
  zIndexMode: "basic",
  defaults: {}
}, Zw = {
  ...sh,
  checkEquality: !0
};
function fh(l, i) {
  const o = { ...l };
  for (const r in i)
    i[r] !== void 0 && (o[r] = i[r]);
  return o;
}
function Gw(l, i, o) {
  const r = fh(sh, o);
  for (const s of l.values())
    if (s.parentId)
      hh(s, l, i, r);
    else {
      const f = Wu(s, r.nodeOrigin), d = _a(s.extent) ? s.extent : r.nodeExtent, g = Ea(f, d, bn(s));
      s.internals.positionAbsolute = g;
    }
}
function Qw(l, i) {
  if (!l.handles)
    return l.measured ? i?.internals.handleBounds : void 0;
  const o = [], r = [];
  for (const s of l.handles) {
    const f = {
      id: s.id,
      width: s.width ?? 1,
      height: s.height ?? 1,
      nodeId: l.id,
      x: s.x,
      y: s.y,
      position: s.position,
      type: s.type
    };
    s.type === "source" ? o.push(f) : s.type === "target" && r.push(f);
  }
  return {
    source: o,
    target: r
  };
}
function dh(l) {
  return l === "manual";
}
function Gd(l, i, o, r = {}) {
  const s = fh(Zw, r), f = { i: 0 }, d = new Map(i), g = s?.elevateNodesOnSelect && !dh(s.zIndexMode) ? Pp : 0;
  let S = l.length > 0, v = !1;
  i.clear(), o.clear();
  for (const y of l) {
    let m = d.get(y.id);
    if (s.checkEquality && y === m?.internals.userNode)
      i.set(y.id, m);
    else {
      const p = Wu(y, s.nodeOrigin), b = _a(y.extent) ? y.extent : s.nodeExtent, E = Ea(p, b, bn(y));
      m = {
        ...s.defaults,
        ...y,
        measured: {
          width: y.measured?.width,
          height: y.measured?.height
        },
        internals: {
          positionAbsolute: E,
          // if user re-initializes the node or removes `measured` for whatever reason, we reset the handleBounds so that the node gets re-measured
          handleBounds: Qw(y, m),
          z: t1(y, g, s.zIndexMode),
          userNode: y
        }
      }, i.set(y.id, m);
    }
    (m.measured === void 0 || m.measured.width === void 0 || m.measured.height === void 0) && !m.hidden && (S = !1), y.parentId && hh(m, i, o, r, f), v ||= y.selected ?? !1;
  }
  return { nodesInitialized: S, hasSelectedNodes: v };
}
function Kw(l, i) {
  if (!l.parentId)
    return;
  const o = i.get(l.parentId);
  o ? o.set(l.id, l) : i.set(l.parentId, /* @__PURE__ */ new Map([[l.id, l]]));
}
function hh(l, i, o, r, s) {
  const { elevateNodesOnSelect: f, nodeOrigin: d, nodeExtent: g, zIndexMode: S } = fh(sh, r), v = l.parentId, y = i.get(v);
  if (!y) {
    console.warn(`Parent node ${v} not found. Please make sure that parent nodes are in front of their child nodes in the nodes array.`);
    return;
  }
  Kw(l, o), s && !y.parentId && y.internals.rootParentIndex === void 0 && S === "auto" && (y.internals.rootParentIndex = ++s.i, y.internals.z = y.internals.z + s.i * jw), s && y.internals.rootParentIndex !== void 0 && (s.i = y.internals.rootParentIndex);
  const m = f && !dh(S) ? Pp : 0, { x: p, y: b, z: E } = $w(l, y, d, g, m, S), { positionAbsolute: C } = l.internals, N = p !== C.x || b !== C.y;
  (N || E !== l.internals.z) && i.set(l.id, {
    ...l,
    internals: {
      ...l.internals,
      positionAbsolute: N ? { x: p, y: b } : C,
      z: E
    }
  });
}
function t1(l, i, o) {
  const r = vn(l.zIndex) ? l.zIndex : 0;
  return dh(o) ? r : r + (l.selected ? i : 0);
}
function $w(l, i, o, r, s, f) {
  const { x: d, y: g } = i.internals.positionAbsolute, S = bn(l), v = Wu(l, o), y = _a(l.extent) ? Ea(v, l.extent, S) : v;
  let m = Ea({ x: d + y.x, y: g + y.y }, r, S);
  l.extent === "parent" && (m = Lp(m, S, i));
  const p = t1(l, s, f), b = i.internals.z ?? 0;
  return {
    x: m.x,
    y: m.y,
    z: b >= p ? b + 1 : p
  };
}
function gh(l, i, o, r = [0, 0]) {
  const s = [], f = /* @__PURE__ */ new Map();
  for (const d of l) {
    const g = i.get(d.parentId);
    if (!g)
      continue;
    const S = f.get(d.parentId)?.expandedRect ?? Ku(g), v = qp(S, d.rect);
    f.set(d.parentId, { expandedRect: v, parent: g });
  }
  return f.size > 0 && f.forEach(({ expandedRect: d, parent: g }, S) => {
    const v = g.internals.positionAbsolute, y = bn(g), m = g.origin ?? r, p = d.x < v.x ? Math.round(Math.abs(v.x - d.x)) : 0, b = d.y < v.y ? Math.round(Math.abs(v.y - d.y)) : 0, E = Math.max(y.width, Math.round(d.width)), C = Math.max(y.height, Math.round(d.height)), N = (E - y.width) * m[0], w = (C - y.height) * m[1];
    (p > 0 || b > 0 || N || w) && (s.push({
      id: S,
      type: "position",
      position: {
        x: g.position.x - p + N,
        y: g.position.y - b + w
      }
    }), o.get(S)?.forEach((U) => {
      l.some((_) => _.id === U.id) || s.push({
        id: U.id,
        type: "position",
        position: {
          x: U.position.x + p,
          y: U.position.y + b
        }
      });
    })), (y.width < d.width || y.height < d.height || p || b) && s.push({
      id: S,
      type: "dimensions",
      setAttributes: !0,
      dimensions: {
        width: E + (p ? m[0] * p - N : 0),
        height: C + (b ? m[1] * b - w : 0)
      }
    });
  }), s;
}
function Jw(l, i, o, r, s, f, d) {
  const g = r?.querySelector(".xyflow__viewport");
  let S = !1;
  if (!g)
    return { changes: [], updatedInternals: S };
  const v = [], y = window.getComputedStyle(g), { m22: m } = new window.DOMMatrixReadOnly(y.transform), p = [];
  for (const b of l.values()) {
    const E = i.get(b.id);
    if (!E)
      continue;
    if (E.hidden) {
      i.set(E.id, {
        ...E,
        internals: {
          ...E.internals,
          handleBounds: void 0
        }
      }), S = !0;
      continue;
    }
    const C = rh(b.nodeElement), N = E.measured.width !== C.width || E.measured.height !== C.height;
    if (!!(C.width && C.height && (N || !E.internals.handleBounds || b.force))) {
      const U = b.nodeElement.getBoundingClientRect(), _ = _a(E.extent) ? E.extent : f;
      let { positionAbsolute: A } = E.internals;
      if (E.parentId && E.extent === "parent") {
        const B = i.get(E.parentId);
        B && (A = Lp(A, C, B));
      } else _ && (A = Ea(A, _, C));
      const j = {
        ...E,
        measured: C,
        internals: {
          ...E.internals,
          positionAbsolute: A,
          handleBounds: {
            source: av("source", b.nodeElement, U, m, E.id),
            target: av("target", b.nodeElement, U, m, E.id)
          }
        }
      };
      i.set(E.id, j), E.parentId && hh(j, i, o, { nodeOrigin: s, zIndexMode: d }), S = !0, N && (v.push({
        id: E.id,
        type: "dimensions",
        dimensions: C
      }), E.expandParent && E.parentId && p.push({
        id: E.id,
        parentId: E.parentId,
        rect: Ku(j, s)
      }));
    }
  }
  if (p.length > 0) {
    const b = gh(p, i, o, s);
    v.push(...b);
  }
  return { changes: v, updatedInternals: S };
}
async function Iw({ delta: l, panZoom: i, transform: o, translateExtent: r, width: s, height: f }) {
  if (!i || !l.x && !l.y)
    return !1;
  const d = await i.setViewportConstrained({
    x: o[0] + l.x,
    y: o[1] + l.y,
    zoom: o[2]
  }, [
    [0, 0],
    [s, f]
  ], r);
  return !!d && (d.x !== o[0] || d.y !== o[1] || d.k !== o[2]);
}
function fv(l, i, o, r, s, f) {
  let d = s;
  const g = r.get(d) || /* @__PURE__ */ new Map();
  r.set(d, g.set(o, i)), d = `${s}-${l}`;
  const S = r.get(d) || /* @__PURE__ */ new Map();
  if (r.set(d, S.set(o, i)), f) {
    d = `${s}-${l}-${f}`;
    const v = r.get(d) || /* @__PURE__ */ new Map();
    r.set(d, v.set(o, i));
  }
}
function e1(l, i, o) {
  l.clear(), i.clear();
  for (const r of o) {
    const { source: s, target: f, sourceHandle: d = null, targetHandle: g = null } = r, S = { edgeId: r.id, source: s, target: f, sourceHandle: d, targetHandle: g }, v = `${s}-${d}--${f}-${g}`, y = `${f}-${g}--${s}-${d}`;
    fv("source", S, y, l, s, d), fv("target", S, v, l, f, g), i.set(r.id, r);
  }
}
function n1(l, i) {
  if (!l.parentId)
    return !1;
  const o = i.get(l.parentId);
  return o ? o.selected ? !0 : n1(o, i) : !1;
}
function dv(l, i, o) {
  let r = l;
  do {
    if (r?.matches?.(i))
      return !0;
    if (r === o)
      return !1;
    r = r?.parentElement;
  } while (r);
  return !1;
}
function kw(l, i, o, r, s) {
  const f = /* @__PURE__ */ new Map();
  for (const [d, g] of l)
    if ((s ? g.id === r : g.selected || g.id === r) && (s || !g.parentId || !n1(g, l)) && (g.draggable || i && typeof g.draggable > "u")) {
      const v = l.get(d);
      v && f.set(d, {
        id: d,
        position: v.position || { x: 0, y: 0 },
        distance: {
          x: o.x - v.internals.positionAbsolute.x,
          y: o.y - v.internals.positionAbsolute.y
        },
        extent: v.extent,
        parentId: v.parentId,
        origin: v.origin,
        expandParent: v.expandParent,
        internals: {
          positionAbsolute: v.internals.positionAbsolute || { x: 0, y: 0 }
        },
        measured: {
          width: v.measured.width ?? 0,
          height: v.measured.height ?? 0
        }
      });
    }
  return f;
}
function _d({ nodeId: l, dragItems: i, nodeLookup: o, dragging: r = !0 }) {
  const s = [];
  for (const [d, g] of i) {
    const S = o.get(d)?.internals.userNode;
    S && s.push({
      ...S,
      position: g.position,
      dragging: r
    });
  }
  if (!l)
    return [s[0], s];
  const f = o.get(l)?.internals.userNode;
  return [
    f ? {
      ...f,
      position: i.get(l)?.position || f.position,
      dragging: r
    } : s[0],
    s
  ];
}
function Fw({ dragItems: l, snapGrid: i, x: o, y: r }) {
  const s = l.values().next().value;
  if (!s)
    return null;
  const f = {
    x: o - s.distance.x,
    y: r - s.distance.y
  }, d = to(f, i);
  return {
    x: d.x - f.x,
    y: d.y - f.y
  };
}
function Ww({ onNodeMouseDown: l, getStoreItems: i, onDragStart: o, onDrag: r, onDragStop: s }) {
  let f = { x: null, y: null }, d = 0, g = /* @__PURE__ */ new Map(), S = !1, v = { x: 0, y: 0 }, y = null, m = !1, p = null, b = !1, E = !1, C = null;
  function N({ noDragClassName: U, handleSelector: _, domNode: A, isSelectable: j, nodeId: B, nodeClickDistance: R = 0 }) {
    p = $e(A);
    function Z({ x: ot, y: lt }) {
      const { nodeLookup: M, nodeExtent: V, snapGrid: O, snapToGrid: H, nodeOrigin: X, onNodeDrag: K, onSelectionDrag: F, onError: at, updateNodePositions: dt } = i();
      f = { x: ot, y: lt };
      let pt = !1;
      const T = g.size > 1, k = T && V ? Xd(Pu(g)) : null, st = T && H ? Fw({
        dragItems: g,
        snapGrid: O,
        x: ot,
        y: lt
      }) : null;
      for (const [ut, I] of g) {
        if (!M.has(ut))
          continue;
        let ft = { x: ot - I.distance.x, y: lt - I.distance.y };
        H && (ft = st ? {
          x: Math.round(ft.x + st.x),
          y: Math.round(ft.y + st.y)
        } : to(ft, O));
        let gt = null;
        if (T && V && !I.extent && k) {
          const { positionAbsolute: vt } = I.internals, wt = vt.x - k.x + V[0][0], _t = vt.x + I.measured.width - k.x2 + V[1][0], Mt = vt.y - k.y + V[0][1], Ht = vt.y + I.measured.height - k.y2 + V[1][1];
          gt = [
            [wt, Mt],
            [_t, Ht]
          ];
        }
        const { position: ct, positionAbsolute: rt } = Vp({
          nodeId: ut,
          nextPosition: ft,
          nodeLookup: M,
          nodeExtent: gt || V,
          nodeOrigin: X,
          onError: at
        });
        pt = pt || I.position.x !== ct.x || I.position.y !== ct.y, I.position = ct, I.internals.positionAbsolute = rt;
      }
      if (E = E || pt, !!pt && (dt(g, !0), C && (r || K || !B && F))) {
        const [ut, I] = _d({
          nodeId: B,
          dragItems: g,
          nodeLookup: M
        });
        r?.(C, g, ut, I), K?.(C, ut, I), B || F?.(C, I);
      }
    }
    async function J() {
      if (!y)
        return;
      const { transform: ot, panBy: lt, autoPanSpeed: M, autoPanOnNodeDrag: V } = i();
      if (!V) {
        S = !1, cancelAnimationFrame(d);
        return;
      }
      const [O, H] = oh(v, y, M);
      (O !== 0 || H !== 0) && (f.x = (f.x ?? 0) - O / ot[2], f.y = (f.y ?? 0) - H / ot[2], await lt({ x: O, y: H }) && Z(f)), d = requestAnimationFrame(J);
    }
    function it(ot) {
      const { nodeLookup: lt, multiSelectionActive: M, nodesDraggable: V, transform: O, snapGrid: H, snapToGrid: X, selectNodesOnDrag: K, onNodeDragStart: F, onSelectionDragStart: at, unselectNodesAndEdges: dt } = i();
      m = !0;
      const pt = !!B && !M && !lt.get(B)?.selected;
      (!K || !j) && !M && B && (lt.get(B)?.selected || dt()), j && K && B && l?.(B);
      const T = Lu(ot.sourceEvent, { transform: O, snapGrid: H, snapToGrid: X, containerBounds: y });
      if (f = T, g = kw(lt, V, T, B, pt), g.size > 0 && (o || F || !B && at)) {
        const [k, st] = _d({
          nodeId: B,
          dragItems: g,
          nodeLookup: lt
        });
        o?.(ot.sourceEvent, g, k, st), F?.(ot.sourceEvent, k, st), B || at?.(ot.sourceEvent, st);
      }
    }
    const tt = cp().clickDistance(R).on("start", (ot) => {
      const { domNode: lt, nodeDragThreshold: M, transform: V, snapGrid: O, snapToGrid: H } = i();
      y = lt?.getBoundingClientRect() || null, b = !1, E = !1, C = ot.sourceEvent, M === 0 && it(ot), f = Lu(ot.sourceEvent, { transform: V, snapGrid: O, snapToGrid: H, containerBounds: y }), v = pn(ot.sourceEvent, y);
    }).on("drag", (ot) => {
      const { autoPanOnNodeDrag: lt, transform: M, snapGrid: V, snapToGrid: O, nodeDragThreshold: H, nodeLookup: X } = i(), K = Lu(ot.sourceEvent, { transform: M, snapGrid: V, snapToGrid: O, containerBounds: y });
      if (C = ot.sourceEvent, (ot.sourceEvent.type === "touchmove" && ot.sourceEvent.touches.length > 1 || // if user deletes a node while dragging, we need to abort the drag to prevent errors
      B && !X.has(B)) && (b = !0), !b) {
        if (!S && lt && m && (S = !0, J()), !m) {
          const F = pn(ot.sourceEvent, y), at = F.x - v.x, dt = F.y - v.y;
          Math.sqrt(at * at + dt * dt) > H && it(ot);
        }
        (f.x !== K.xSnapped || f.y !== K.ySnapped) && g && m && (v = pn(ot.sourceEvent, y), Z(K));
      }
    }).on("end", (ot) => {
      if (!m || b) {
        b && g.size > 0 && i().updateNodePositions(g, !1);
        return;
      }
      if (S = !1, m = !1, cancelAnimationFrame(d), g.size > 0) {
        const { nodeLookup: lt, updateNodePositions: M, onNodeDragStop: V, onSelectionDragStop: O } = i();
        if (E && (M(g, !1), E = !1), s || V || !B && O) {
          const [H, X] = _d({
            nodeId: B,
            dragItems: g,
            nodeLookup: lt,
            dragging: !1
          });
          s?.(ot.sourceEvent, g, H, X), V?.(ot.sourceEvent, H, X), B || O?.(ot.sourceEvent, X);
        }
      }
    }).filter((ot) => {
      const lt = ot.target;
      return !ot.button && (!U || !dv(lt, `.${U}`, A)) && (!_ || dv(lt, _, A));
    });
    p.call(tt);
  }
  function w() {
    p?.on(".drag", null);
  }
  return {
    update: N,
    destroy: w
  };
}
function Pw(l, i, o) {
  const r = [], s = {
    x: l.x - o,
    y: l.y - o,
    width: o * 2,
    height: o * 2
  };
  for (const f of i.values())
    cr(s, Ku(f)) > 0 && r.push(f);
  return r;
}
const t3 = 250;
function e3(l, i, o, r) {
  let s = [], f = 1 / 0;
  const d = Pw(l, o, i + t3);
  for (const g of d) {
    const S = [...g.internals.handleBounds?.source ?? [], ...g.internals.handleBounds?.target ?? []];
    for (const v of S) {
      if (r.nodeId === v.nodeId && r.type === v.type && r.id === v.id)
        continue;
      const { x: y, y: m } = wa(g, v, v.position, !0), p = Math.sqrt(Math.pow(y - l.x, 2) + Math.pow(m - l.y, 2));
      p > i || (p < f ? (s = [{ ...v, x: y, y: m }], f = p) : p === f && s.push({ ...v, x: y, y: m }));
    }
  }
  if (!s.length)
    return null;
  if (s.length > 1) {
    const g = r.type === "source" ? "target" : "source";
    return s.find((S) => S.type === g) ?? s[0];
  }
  return s[0];
}
function l1(l, i, o, r, s, f = !1) {
  const d = r.get(l);
  if (!d)
    return null;
  const g = s === "strict" ? d.internals.handleBounds?.[i] : [...d.internals.handleBounds?.source ?? [], ...d.internals.handleBounds?.target ?? []], S = (o ? g?.find((v) => v.id === o) : g?.[0]) ?? null;
  return S && f ? { ...S, ...wa(d, S, S.position, !0) } : S;
}
function a1(l, i) {
  return l || (i?.classList.contains("target") ? "target" : i?.classList.contains("source") ? "source" : null);
}
function n3(l, i) {
  let o = null;
  return i ? o = !0 : l && !i && (o = !1), o;
}
const i1 = () => !0;
function l3(l, { connectionMode: i, connectionRadius: o, handleId: r, nodeId: s, edgeUpdaterType: f, isTarget: d, domNode: g, nodeLookup: S, lib: v, autoPanOnConnect: y, flowId: m, panBy: p, cancelConnection: b, onConnectStart: E, onConnect: C, onConnectEnd: N, isValidConnection: w = i1, onReconnectEnd: U, updateConnection: _, getTransform: A, getFromHandle: j, autoPanSpeed: B, dragThreshold: R = 1, handleDomNode: Z }) {
  const J = Kp(l.target);
  let it = 0, tt;
  const { x: ot, y: lt } = pn(l), M = a1(f, Z), V = g?.getBoundingClientRect();
  let O = !1;
  if (!V || !M)
    return;
  const H = l1(s, M, r, S, i);
  if (!H)
    return;
  let X = pn(l, V), K = !1, F = null, at = !1, dt = null;
  function pt() {
    if (!y || !V)
      return;
    const [ct, rt] = oh(X, V, B);
    p({ x: ct, y: rt }), it = requestAnimationFrame(pt);
  }
  const T = {
    ...H,
    nodeId: s,
    type: M,
    position: H.position
  }, k = S.get(s);
  let ut = {
    inProgress: !0,
    isValid: null,
    from: wa(k, T, xt.Left, !0),
    fromHandle: T,
    fromPosition: T.position,
    fromNode: k,
    to: X,
    toHandle: null,
    toPosition: tv[T.position],
    toNode: null,
    pointer: X
  };
  function I() {
    O = !0, _(ut), E?.(l, { nodeId: s, handleId: r, handleType: M });
  }
  R === 0 && I();
  function ft(ct) {
    if (!O) {
      const { x: Ht, y: Ot } = pn(ct), Pt = Ht - ot, xe = Ot - lt;
      if (!(Pt * Pt + xe * xe > R * R))
        return;
      I();
    }
    if (!j() || !T) {
      gt(ct);
      return;
    }
    const rt = A();
    X = pn(ct, V), tt = e3(eo(X, rt, !1, [1, 1]), o, S, T), K || (pt(), K = !0);
    const vt = u1(ct, {
      handle: tt,
      connectionMode: i,
      fromNodeId: s,
      fromHandleId: r,
      fromType: d ? "target" : "source",
      isValidConnection: w,
      doc: J,
      lib: v,
      flowId: m,
      nodeLookup: S
    });
    dt = vt.handleDomNode, F = vt.connection, at = n3(!!tt, vt.isValid);
    const wt = S.get(s), _t = wt ? wa(wt, T, xt.Left, !0) : ut.from, Mt = {
      ...ut,
      from: _t,
      isValid: at,
      to: vt.toHandle && at ? Oi({ x: vt.toHandle.x, y: vt.toHandle.y }, rt) : X,
      toHandle: vt.toHandle,
      toPosition: at && vt.toHandle ? vt.toHandle.position : tv[T.position],
      toNode: vt.toHandle ? S.get(vt.toHandle.nodeId) : null,
      pointer: X
    };
    _(Mt), ut = Mt;
  }
  function gt(ct) {
    if (!("touches" in ct && ct.touches.length > 0)) {
      if (O) {
        (tt || dt) && F && at && C?.(F);
        const { inProgress: rt, ...vt } = ut, wt = {
          ...vt,
          toPosition: ut.toHandle ? ut.toPosition : null
        };
        N?.(ct, wt), f && U?.(ct, wt);
      }
      b(), cancelAnimationFrame(it), K = !1, at = !1, F = null, dt = null, J.removeEventListener("mousemove", ft), J.removeEventListener("mouseup", gt), J.removeEventListener("touchmove", ft), J.removeEventListener("touchend", gt);
    }
  }
  J.addEventListener("mousemove", ft), J.addEventListener("mouseup", gt), J.addEventListener("touchmove", ft), J.addEventListener("touchend", gt);
}
function u1(l, { handle: i, connectionMode: o, fromNodeId: r, fromHandleId: s, fromType: f, doc: d, lib: g, flowId: S, isValidConnection: v = i1, nodeLookup: y }) {
  const m = f === "target", p = i ? d.querySelector(`.${g}-flow__handle[data-id="${S}-${i?.nodeId}-${i?.id}-${i?.type}"]`) : null, { x: b, y: E } = pn(l), C = d.elementFromPoint(b, E), N = C?.classList.contains(`${g}-flow__handle`) ? C : p, w = {
    handleDomNode: N,
    isValid: !1,
    connection: null,
    toHandle: null
  };
  if (N) {
    const U = a1(void 0, N), _ = N.getAttribute("data-nodeid"), A = N.getAttribute("data-handleid"), j = N.classList.contains("connectable"), B = N.classList.contains("connectableend");
    if (!_ || !U)
      return w;
    const R = {
      source: m ? _ : r,
      sourceHandle: m ? A : s,
      target: m ? r : _,
      targetHandle: m ? s : A
    };
    w.connection = R;
    const J = j && B && (o === Ci.Strict ? m && U === "source" || !m && U === "target" : _ !== r || A !== s);
    w.isValid = J && v(R), w.toHandle = l1(_, U, A, y, o, !0);
  }
  return w;
}
const Qd = {
  onPointerDown: l3,
  isValid: u1
};
function a3({ domNode: l, panZoom: i, getTransform: o, getViewScale: r }) {
  const s = $e(l);
  function f({ translateExtent: g, width: S, height: v, zoomStep: y = 1, pannable: m = !0, zoomable: p = !0, inversePan: b = !1 }) {
    const E = (_) => {
      if (_.sourceEvent.type !== "wheel" || !i)
        return;
      const A = o(), j = _.sourceEvent.ctrlKey && $u() ? 10 : 1, B = -_.sourceEvent.deltaY * (_.sourceEvent.deltaMode === 1 ? 0.05 : _.sourceEvent.deltaMode ? 1 : 2e-3) * y, R = A[2] * Math.pow(2, B * j);
      i.scaleTo(R);
    };
    let C = [0, 0];
    const N = (_) => {
      (_.sourceEvent.type === "mousedown" || _.sourceEvent.type === "touchstart") && (C = [
        _.sourceEvent.clientX ?? _.sourceEvent.touches[0].clientX,
        _.sourceEvent.clientY ?? _.sourceEvent.touches[0].clientY
      ]);
    }, w = (_) => {
      const A = o();
      if (_.sourceEvent.type !== "mousemove" && _.sourceEvent.type !== "touchmove" || !i)
        return;
      const j = [
        _.sourceEvent.clientX ?? _.sourceEvent.touches[0].clientX,
        _.sourceEvent.clientY ?? _.sourceEvent.touches[0].clientY
      ], B = [j[0] - C[0], j[1] - C[1]];
      C = j;
      const R = r() * Math.max(A[2], Math.log(A[2])) * (b ? -1 : 1), Z = {
        x: A[0] - B[0] * R,
        y: A[1] - B[1] * R
      }, J = [
        [0, 0],
        [S, v]
      ];
      i.setViewportConstrained({
        x: Z.x,
        y: Z.y,
        zoom: A[2]
      }, J, g);
    }, U = Rp().on("start", N).on("zoom", m ? w : null).on("zoom.wheel", p ? E : null);
    s.call(U, {});
  }
  function d() {
    s.on("zoom", null);
  }
  return {
    update: f,
    destroy: d,
    pointer: mn
  };
}
const xr = (l) => ({
  x: l.x,
  y: l.y,
  zoom: l.k
}), wd = ({ x: l, y: i, zoom: o }) => vr.translate(l, i).scale(o), Vl = (l, i) => l.target.closest(`.${i}`), o1 = (l, i) => i === 2 && Array.isArray(l) && l.includes(2), i3 = (l) => ((l *= 2) <= 1 ? l * l * l : (l -= 2) * l * l + 2) / 2, Nd = (l, i = 0, o = i3, r = () => {
}) => {
  const s = typeof i == "number" && i > 0;
  return s || r(), s ? l.transition().duration(i).ease(o).on("end", r) : l;
}, c1 = (l) => {
  const i = l.ctrlKey && $u() ? 10 : 1;
  return -l.deltaY * (l.deltaMode === 1 ? 0.05 : l.deltaMode ? 1 : 2e-3) * i;
};
function u3({ zoomPanValues: l, noWheelClassName: i, d3Selection: o, d3Zoom: r, panOnScrollMode: s, panOnScrollSpeed: f, zoomOnPinch: d, onPanZoomStart: g, onPanZoom: S, onPanZoomEnd: v }) {
  return (y) => {
    if (Vl(y, i))
      return y.ctrlKey && y.preventDefault(), !1;
    y.preventDefault(), y.stopImmediatePropagation();
    const m = o.property("__zoom").k || 1;
    if (y.ctrlKey && d) {
      const N = mn(y), w = c1(y), U = m * Math.pow(2, w);
      r.scaleTo(o, U, N, y);
      return;
    }
    const p = y.deltaMode === 1 ? 20 : 1;
    let b = s === pa.Vertical ? 0 : y.deltaX * p, E = s === pa.Horizontal ? 0 : y.deltaY * p;
    !$u() && y.shiftKey && s !== pa.Vertical && (b = y.deltaY * p, E = 0), r.translateBy(
      o,
      -(b / m) * f,
      -(E / m) * f,
      // @ts-ignore
      { internal: !0 }
    );
    const C = xr(o.property("__zoom"));
    clearTimeout(l.panScrollTimeout), l.isPanScrolling ? S?.(y, C) : (l.isPanScrolling = !0, g?.(y, C)), l.panScrollTimeout = setTimeout(() => {
      v?.(y, C), l.isPanScrolling = !1;
    }, 150);
  };
}
function o3({ noWheelClassName: l, preventScrolling: i, d3ZoomHandler: o }) {
  return function(r, s) {
    const f = r.type === "wheel", d = !i && f && !r.ctrlKey, g = Vl(r, l);
    if (r.ctrlKey && f && g && r.preventDefault(), d || g)
      return null;
    r.preventDefault(), o.call(this, r, s);
  };
}
function c3({ zoomPanValues: l, onDraggingChange: i, onPanZoomStart: o }) {
  return (r) => {
    if (r.sourceEvent?.internal)
      return;
    const s = xr(r.transform);
    l.mouseButton = r.sourceEvent?.button || 0, l.isZoomingOrPanning = !0, l.prevViewport = s, r.sourceEvent?.type === "mousedown" && i(!0), o && o?.(r.sourceEvent, s);
  };
}
function r3({ zoomPanValues: l, panOnDrag: i, onPaneContextMenu: o, onTransformChange: r, onPanZoom: s }) {
  return (f) => {
    l.usedRightMouseButton = !!(o && o1(i, l.mouseButton ?? 0)), f.sourceEvent?.sync || r([f.transform.x, f.transform.y, f.transform.k]), s && !f.sourceEvent?.internal && s?.(f.sourceEvent, xr(f.transform));
  };
}
function s3({ zoomPanValues: l, panOnDrag: i, panOnScroll: o, onDraggingChange: r, onPanZoomEnd: s, onPaneContextMenu: f }) {
  return (d) => {
    if (!d.sourceEvent?.internal && (l.isZoomingOrPanning = !1, f && o1(i, l.mouseButton ?? 0) && !l.usedRightMouseButton && d.sourceEvent && f(d.sourceEvent), l.usedRightMouseButton = !1, r(!1), s)) {
      const g = xr(d.transform);
      l.prevViewport = g, clearTimeout(l.timerId), l.timerId = setTimeout(
        () => {
          s?.(d.sourceEvent, g);
        },
        // we need a setTimeout for panOnScroll to suppress multiple end events fired during scroll
        o ? 150 : 0
      );
    }
  };
}
function f3({ panActivationKeyPressed: l, zoomActivationKeyPressed: i, zoomOnScroll: o, zoomOnPinch: r, panOnDrag: s, panOnScroll: f, zoomOnDoubleClick: d, userSelectionActive: g, noWheelClassName: S, noPanClassName: v, lib: y, connectionInProgress: m }) {
  return (p) => {
    const b = i || o, E = r && p.ctrlKey, C = p.type === "wheel";
    if (p.button === 1 && p.type === "mousedown" && (Vl(p, `${y}-flow__node`) || Vl(p, `${y}-flow__edge`) || Vl(p, `${y}-flow__selection`) || Vl(p, `${y}-flow__nodesselection`)))
      return !0;
    if (!s && !b && !f && !d && !r || g || m && !C || Vl(p, S) && C || Vl(p, v) && (!C || f && C && !i) || !r && p.ctrlKey && C)
      return !1;
    if (!r && p.type === "touchstart" && p.touches?.length > 1)
      return p.preventDefault(), !1;
    if (!b && !f && !E && C || !s && (p.type === "mousedown" || p.type === "touchstart") || Array.isArray(s) && !s.includes(p.button) && p.type === "mousedown")
      return !1;
    const N = Array.isArray(s) && s.includes(p.button) || !p.button || p.button <= 1;
    return (!p.ctrlKey || C || l) && N;
  };
}
function d3({ domNode: l, minZoom: i, maxZoom: o, translateExtent: r, viewport: s, onPanZoom: f, onPanZoomStart: d, onPanZoomEnd: g, onDraggingChange: S }) {
  const v = {
    isZoomingOrPanning: !1,
    usedRightMouseButton: !1,
    prevViewport: {},
    mouseButton: 0,
    timerId: void 0,
    panScrollTimeout: void 0,
    isPanScrolling: !1
  }, y = l.getBoundingClientRect();
  let m = [
    [0, 0],
    [y.width, y.height]
  ];
  const p = typeof ResizeObserver < "u" ? new ResizeObserver((lt) => {
    const M = lt[0];
    M?.contentRect && (m = [
      [0, 0],
      [M.contentRect.width, M.contentRect.height]
    ]);
  }) : null;
  p?.observe(l);
  const b = Rp().extent(() => m).scaleExtent([i, o]).translateExtent(r), E = $e(l).call(b);
  A({
    x: s.x,
    y: s.y,
    zoom: Ai(s.zoom, i, o)
  }, [
    [0, 0],
    [y.width, y.height]
  ], r);
  const C = E.on("wheel.zoom"), N = E.on("dblclick.zoom");
  b.wheelDelta(c1);
  async function w(lt, M) {
    return E ? new Promise((V) => {
      b?.interpolate(M?.interpolate === "linear" ? Vu : Jc).transform(Nd(E, M?.duration, M?.ease, () => V(!0)), lt);
    }) : !1;
  }
  function U({ noWheelClassName: lt, noPanClassName: M, onPaneContextMenu: V, userSelectionActive: O, panOnScroll: H, panOnDrag: X, panOnScrollMode: K, panOnScrollSpeed: F, preventScrolling: at, zoomOnPinch: dt, zoomOnScroll: pt, zoomOnDoubleClick: T, panActivationKeyPressed: k = !1, zoomActivationKeyPressed: st, lib: ut, onTransformChange: I, connectionInProgress: ft, paneClickDistance: gt, selectionOnDrag: ct }) {
    O && !v.isZoomingOrPanning && b.on("zoom", null);
    const rt = H && !st && !O;
    b.clickDistance(ct ? 1 / 0 : !vn(gt) || gt < 0 ? 0 : gt);
    const vt = rt ? u3({
      zoomPanValues: v,
      noWheelClassName: lt,
      d3Selection: E,
      d3Zoom: b,
      panOnScrollMode: K,
      panOnScrollSpeed: F,
      zoomOnPinch: dt,
      onPanZoomStart: d,
      onPanZoom: f,
      onPanZoomEnd: g
    }) : o3({
      noWheelClassName: lt,
      preventScrolling: at,
      d3ZoomHandler: C
    });
    E.on("wheel.zoom", vt, { passive: !1 });
    const wt = c3({
      zoomPanValues: v,
      onDraggingChange: S,
      onPanZoomStart: d
    });
    b.on("start", wt);
    const _t = r3({
      zoomPanValues: v,
      panOnDrag: X,
      onPaneContextMenu: !!V,
      onPanZoom: f,
      onTransformChange: I
    });
    b.on("zoom", _t);
    const Mt = s3({
      zoomPanValues: v,
      panOnDrag: X,
      panOnScroll: H,
      onPaneContextMenu: V,
      onPanZoomEnd: g,
      onDraggingChange: S
    });
    b.on("end", Mt);
    const Ht = f3({
      panActivationKeyPressed: k,
      zoomActivationKeyPressed: st,
      panOnDrag: X,
      zoomOnScroll: pt,
      panOnScroll: H,
      zoomOnDoubleClick: T,
      zoomOnPinch: dt,
      userSelectionActive: O,
      noPanClassName: M,
      noWheelClassName: lt,
      lib: ut,
      connectionInProgress: ft
    });
    b.filter(Ht), T ? E.on("dblclick.zoom", N) : E.on("dblclick.zoom", null);
  }
  function _() {
    b.on("zoom", null), p?.disconnect();
  }
  async function A(lt, M, V) {
    const O = wd(lt), H = b?.constrain()(O, M, V);
    return H && await w(H), H;
  }
  async function j(lt, M) {
    const V = wd(lt);
    return await w(V, M), V;
  }
  function B(lt) {
    if (E) {
      const M = wd(lt), V = E.property("__zoom");
      (V.k !== lt.zoom || V.x !== lt.x || V.y !== lt.y) && b?.transform(E, M, null, { sync: !0 });
    }
  }
  function R() {
    const lt = E ? Dp(E.node()) : { x: 0, y: 0, k: 1 };
    return { x: lt.x, y: lt.y, zoom: lt.k };
  }
  async function Z(lt, M) {
    return E ? new Promise((V) => {
      b?.interpolate(M?.interpolate === "linear" ? Vu : Jc).scaleTo(Nd(E, M?.duration, M?.ease, () => V(!0)), lt);
    }) : !1;
  }
  async function J(lt, M) {
    return E ? new Promise((V) => {
      b?.interpolate(M?.interpolate === "linear" ? Vu : Jc).scaleBy(Nd(E, M?.duration, M?.ease, () => V(!0)), lt);
    }) : !1;
  }
  function it(lt) {
    b?.scaleExtent(lt);
  }
  function tt(lt) {
    b?.translateExtent(lt);
  }
  function ot(lt) {
    const M = !vn(lt) || lt < 0 ? 0 : lt;
    b?.clickDistance(M);
  }
  return {
    update: U,
    destroy: _,
    setViewport: j,
    setViewportConstrained: A,
    getViewport: R,
    scaleTo: Z,
    scaleBy: J,
    setScaleExtent: it,
    setTranslateExtent: tt,
    syncViewport: B,
    setClickDistance: ot
  };
}
var Di;
(function(l) {
  l.Line = "line", l.Handle = "handle";
})(Di || (Di = {}));
function h3({ width: l, prevWidth: i, height: o, prevHeight: r, affectsX: s, affectsY: f }) {
  const d = l - i, g = o - r, S = [d > 0 ? 1 : d < 0 ? -1 : 0, g > 0 ? 1 : g < 0 ? -1 : 0];
  return d && s && (S[0] = S[0] * -1), g && f && (S[1] = S[1] * -1), S;
}
function hv(l) {
  const i = l.includes("right") || l.includes("left"), o = l.includes("bottom") || l.includes("top"), r = l.includes("left"), s = l.includes("top");
  return {
    isHorizontal: i,
    isVertical: o,
    affectsX: r,
    affectsY: s
  };
}
function Bl(l, i) {
  return Math.max(0, i - l);
}
function Yl(l, i) {
  return Math.max(0, l - i);
}
function Gc(l, i, o) {
  return Math.max(0, i - l, l - o);
}
function gv(l, i) {
  return l ? !i : i;
}
function g3(l, i, o, r, s, f, d, g) {
  let { affectsX: S, affectsY: v } = i;
  const { isHorizontal: y, isVertical: m } = i, p = y && m, { xSnapped: b, ySnapped: E } = o, { minWidth: C, maxWidth: N, minHeight: w, maxHeight: U } = r, { x: _, y: A, width: j, height: B, aspectRatio: R } = l;
  let Z = Math.floor(y ? b - l.pointerX : 0), J = Math.floor(m ? E - l.pointerY : 0);
  const it = j + (S ? -Z : Z), tt = B + (v ? -J : J), ot = -f[0] * j, lt = -f[1] * B;
  let M = Gc(it, C, N), V = Gc(tt, w, U);
  if (d) {
    let X = 0, K = 0;
    S && Z < 0 ? X = Bl(_ + Z + ot, d[0][0]) : !S && Z > 0 && (X = Yl(_ + it + ot, d[1][0])), v && J < 0 ? K = Bl(A + J + lt, d[0][1]) : !v && J > 0 && (K = Yl(A + tt + lt, d[1][1])), M = Math.max(M, X), V = Math.max(V, K);
  }
  if (g) {
    let X = 0, K = 0;
    S && Z > 0 ? X = Yl(_ + Z, g[0][0]) : !S && Z < 0 && (X = Bl(_ + it, g[1][0])), v && J > 0 ? K = Yl(A + J, g[0][1]) : !v && J < 0 && (K = Bl(A + tt, g[1][1])), M = Math.max(M, X), V = Math.max(V, K);
  }
  if (s) {
    if (y) {
      const X = Gc(it / R, w, U) * R;
      if (M = Math.max(M, X), d) {
        let K = 0;
        !S && !v || S && !v && p ? K = Yl(A + lt + it / R, d[1][1]) * R : K = Bl(A + lt + (S ? Z : -Z) / R, d[0][1]) * R, M = Math.max(M, K);
      }
      if (g) {
        let K = 0;
        !S && !v || S && !v && p ? K = Bl(A + it / R, g[1][1]) * R : K = Yl(A + (S ? Z : -Z) / R, g[0][1]) * R, M = Math.max(M, K);
      }
    }
    if (m) {
      const X = Gc(tt * R, C, N) / R;
      if (V = Math.max(V, X), d) {
        let K = 0;
        !S && !v || v && !S && p ? K = Yl(_ + tt * R + ot, d[1][0]) / R : K = Bl(_ + (v ? J : -J) * R + ot, d[0][0]) / R, V = Math.max(V, K);
      }
      if (g) {
        let K = 0;
        !S && !v || v && !S && p ? K = Bl(_ + tt * R, g[1][0]) / R : K = Yl(_ + (v ? J : -J) * R, g[0][0]) / R, V = Math.max(V, K);
      }
    }
  }
  J = J + (J < 0 ? V : -V), Z = Z + (Z < 0 ? M : -M), s && (p ? it > tt * R ? J = (gv(S, v) ? -Z : Z) / R : Z = (gv(S, v) ? -J : J) * R : y ? (J = Z / R, v = S) : (Z = J * R, S = v));
  const O = S ? _ + Z : _, H = v ? A + J : A;
  return {
    width: j + (S ? -Z : Z),
    height: B + (v ? -J : J),
    x: f[0] * Z * (S ? -1 : 1) + O,
    y: f[1] * J * (v ? -1 : 1) + H
  };
}
const r1 = { width: 0, height: 0, x: 0, y: 0 }, m3 = {
  ...r1,
  pointerX: 0,
  pointerY: 0,
  aspectRatio: 1
};
function y3(l, i, o) {
  const r = i.position.x + l.position.x, s = i.position.y + l.position.y, f = l.measured.width ?? 0, d = l.measured.height ?? 0, g = o[0] * f, S = o[1] * d;
  return [
    [r - g, s - S],
    [r + f - g, s + d - S]
  ];
}
function v3({ domNode: l, nodeId: i, getStoreItems: o, onChange: r, onEnd: s }) {
  const f = $e(l);
  let d = {
    controlDirection: hv("bottom-right"),
    boundaries: {
      minWidth: 0,
      minHeight: 0,
      maxWidth: Number.MAX_VALUE,
      maxHeight: Number.MAX_VALUE
    },
    resizeDirection: void 0,
    keepAspectRatio: !1
  };
  function g({ controlPosition: v, boundaries: y, keepAspectRatio: m, resizeDirection: p, onResizeStart: b, onResize: E, onResizeEnd: C, shouldResize: N }) {
    let w = { ...r1 }, U = { ...m3 };
    d = {
      boundaries: y,
      resizeDirection: p,
      keepAspectRatio: m,
      controlDirection: hv(v)
    };
    let _, A = null, j = [], B, R, Z;
    const J = cp().on("start", (it) => {
      const { nodeLookup: tt, transform: ot, snapGrid: lt, snapToGrid: M, nodeOrigin: V, paneDomNode: O } = o();
      if (_ = tt.get(i), !_)
        return;
      A = O?.getBoundingClientRect() ?? null;
      const { xSnapped: H, ySnapped: X } = Lu(it.sourceEvent, {
        transform: ot,
        snapGrid: lt,
        snapToGrid: M,
        containerBounds: A
      });
      w = {
        width: _.measured.width ?? 0,
        height: _.measured.height ?? 0,
        x: _.position.x ?? 0,
        y: _.position.y ?? 0
      }, U = {
        ...w,
        pointerX: H,
        pointerY: X,
        aspectRatio: w.width / w.height
      }, B = void 0, R = _a(_.extent) ? _.extent : void 0, _.parentId && (_.extent === "parent" || _.expandParent) && (B = tt.get(_.parentId)), B && _.extent === "parent" && (R = [
        [0, 0],
        [B.measured.width, B.measured.height]
      ]), j = [], Z = void 0;
      for (const [K, F] of tt)
        if (F.parentId === i && (j.push({
          id: K,
          position: { ...F.position },
          extent: F.extent
        }), F.extent === "parent" || F.expandParent)) {
          const at = y3(F, _, F.origin ?? V);
          Z ? Z = [
            [Math.min(at[0][0], Z[0][0]), Math.min(at[0][1], Z[0][1])],
            [Math.max(at[1][0], Z[1][0]), Math.max(at[1][1], Z[1][1])]
          ] : Z = at;
        }
      b?.(it, { ...w });
    }).on("drag", (it) => {
      const { transform: tt, snapGrid: ot, snapToGrid: lt, nodeOrigin: M } = o(), V = Lu(it.sourceEvent, {
        transform: tt,
        snapGrid: ot,
        snapToGrid: lt,
        containerBounds: A
      }), O = [];
      if (!_)
        return;
      const { x: H, y: X, width: K, height: F } = w, at = {}, dt = _.origin ?? M, { width: pt, height: T, x: k, y: st } = g3(U, d.controlDirection, V, d.boundaries, d.keepAspectRatio, dt, R, Z), ut = pt !== K, I = T !== F, ft = k !== H && ut, gt = st !== X && I;
      if (!ft && !gt && !ut && !I)
        return;
      const ct = {
        prevValues: { ...w },
        startX: U.x,
        startY: U.y,
        childNodes: j.map((_t) => ({
          ..._t,
          position: { ..._t.position }
        }))
      };
      if ((ft || gt || dt[0] === 1 || dt[1] === 1) && (at.x = ft ? k : w.x, at.y = gt ? st : w.y, w.x = at.x, w.y = at.y, j.length > 0)) {
        const _t = k - H, Mt = st - X;
        for (const Ht of j)
          Ht.position = {
            x: Ht.position.x - _t + dt[0] * (pt - K),
            y: Ht.position.y - Mt + dt[1] * (T - F)
          }, O.push(Ht);
      }
      if ((ut || I) && (at.width = ut && (!d.resizeDirection || d.resizeDirection === "horizontal") ? pt : w.width, at.height = I && (!d.resizeDirection || d.resizeDirection === "vertical") ? T : w.height, w.width = at.width, w.height = at.height), B && _.expandParent) {
        const _t = dt[0] * (at.width ?? 0);
        at.x && at.x < _t && (w.x = _t, U.x = U.x - (at.x - _t));
        const Mt = dt[1] * (at.height ?? 0);
        at.y && at.y < Mt && (w.y = Mt, U.y = U.y - (at.y - Mt));
      }
      const rt = h3({
        width: w.width,
        prevWidth: K,
        height: w.height,
        prevHeight: F,
        affectsX: d.controlDirection.affectsX,
        affectsY: d.controlDirection.affectsY
      }), vt = { ...w, direction: rt };
      if (N?.(it, vt) === !1) {
        w = ct.prevValues, U.x = ct.startX, U.y = ct.startY, j.forEach((_t, Mt) => {
          _t.position = ct.childNodes[Mt].position;
        });
        return;
      }
      E?.(it, vt), r(at, O);
    }).on("end", (it) => {
      C?.(it, { ...w }), s?.({ ...w });
    });
    f.call(J);
  }
  function S() {
    f.on(".drag", null);
  }
  return {
    update: g,
    destroy: S
  };
}
var Td = { exports: {} }, Md = {}, zd = { exports: {} }, Cd = {};
var mv;
function p3() {
  if (mv) return Cd;
  mv = 1;
  var l = Iu();
  function i(m, p) {
    return m === p && (m !== 0 || 1 / m === 1 / p) || m !== m && p !== p;
  }
  var o = typeof Object.is == "function" ? Object.is : i, r = l.useState, s = l.useEffect, f = l.useLayoutEffect, d = l.useDebugValue;
  function g(m, p) {
    var b = p(), E = r({ inst: { value: b, getSnapshot: p } }), C = E[0].inst, N = E[1];
    return f(
      function() {
        C.value = b, C.getSnapshot = p, S(C) && N({ inst: C });
      },
      [m, b, p]
    ), s(
      function() {
        return S(C) && N({ inst: C }), m(function() {
          S(C) && N({ inst: C });
        });
      },
      [m]
    ), d(b), b;
  }
  function S(m) {
    var p = m.getSnapshot;
    m = m.value;
    try {
      var b = p();
      return !o(m, b);
    } catch {
      return !0;
    }
  }
  function v(m, p) {
    return p();
  }
  var y = typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u" ? v : g;
  return Cd.useSyncExternalStore = l.useSyncExternalStore !== void 0 ? l.useSyncExternalStore : y, Cd;
}
var yv;
function S3() {
  return yv || (yv = 1, zd.exports = p3()), zd.exports;
}
var vv;
function x3() {
  if (vv) return Md;
  vv = 1;
  var l = Iu(), i = S3();
  function o(v, y) {
    return v === y && (v !== 0 || 1 / v === 1 / y) || v !== v && y !== y;
  }
  var r = typeof Object.is == "function" ? Object.is : o, s = i.useSyncExternalStore, f = l.useRef, d = l.useEffect, g = l.useMemo, S = l.useDebugValue;
  return Md.useSyncExternalStoreWithSelector = function(v, y, m, p, b) {
    var E = f(null);
    if (E.current === null) {
      var C = { hasValue: !1, value: null };
      E.current = C;
    } else C = E.current;
    E = g(
      function() {
        function w(B) {
          if (!U) {
            if (U = !0, _ = B, B = p(B), b !== void 0 && C.hasValue) {
              var R = C.value;
              if (b(R, B))
                return A = R;
            }
            return A = B;
          }
          if (R = A, r(_, B)) return R;
          var Z = p(B);
          return b !== void 0 && b(R, Z) ? (_ = B, R) : (_ = B, A = Z);
        }
        var U = !1, _, A, j = m === void 0 ? null : m;
        return [
          function() {
            return w(y());
          },
          j === null ? void 0 : function() {
            return w(j());
          }
        ];
      },
      [y, m, p, b]
    );
    var N = s(v, E[0], E[1]);
    return d(
      function() {
        C.hasValue = !0, C.value = N;
      },
      [N]
    ), S(N), N;
  }, Md;
}
var pv;
function b3() {
  return pv || (pv = 1, Td.exports = x3()), Td.exports;
}
var E3 = b3();
const _3 = /* @__PURE__ */ Kv(E3), w3 = {}, Sv = (l) => {
  let i;
  const o = /* @__PURE__ */ new Set(), r = (y, m) => {
    const p = typeof y == "function" ? y(i) : y;
    if (!Object.is(p, i)) {
      const b = i;
      i = m ?? (typeof p != "object" || p === null) ? p : Object.assign({}, i, p), o.forEach((E) => E(i, b));
    }
  }, s = () => i, S = { setState: r, getState: s, getInitialState: () => v, subscribe: (y) => (o.add(y), () => o.delete(y)), destroy: () => {
    (w3 ? "production" : void 0) !== "production" && console.warn(
      "[DEPRECATED] The `destroy` method will be unsupported in a future version. Instead use unsubscribe function returned by subscribe. Everything will be garbage-collected if store is garbage-collected."
    ), o.clear();
  } }, v = i = l(r, s, S);
  return S;
}, N3 = (l) => l ? Sv(l) : Sv, { useDebugValue: T3 } = Si, { useSyncExternalStoreWithSelector: M3 } = _3, z3 = (l) => l;
function s1(l, i = z3, o) {
  const r = M3(
    l.subscribe,
    l.getState,
    l.getServerState || l.getInitialState,
    i,
    o
  );
  return T3(r), r;
}
const xv = (l, i) => {
  const o = N3(l), r = (s, f = i) => s1(o, s, f);
  return Object.assign(r, o), r;
}, C3 = (l, i) => l ? xv(l, i) : xv;
function kt(l, i) {
  if (Object.is(l, i))
    return !0;
  if (typeof l != "object" || l === null || typeof i != "object" || i === null)
    return !1;
  if (l instanceof Map && i instanceof Map) {
    if (l.size !== i.size) return !1;
    for (const [r, s] of l)
      if (!Object.is(s, i.get(r)))
        return !1;
    return !0;
  }
  if (l instanceof Set && i instanceof Set) {
    if (l.size !== i.size) return !1;
    for (const r of l)
      if (!i.has(r))
        return !1;
    return !0;
  }
  const o = Object.keys(l);
  if (o.length !== Object.keys(i).length)
    return !1;
  for (const r of o)
    if (!Object.prototype.hasOwnProperty.call(i, r) || !Object.is(l[r], i[r]))
      return !1;
  return !0;
}
$v();
const br = P.createContext(null), A3 = br.Provider, f1 = Sn.error001("react");
function Bt(l, i) {
  const o = P.useContext(br);
  if (o === null)
    throw new Error(f1);
  return s1(o, l, i);
}
function $t() {
  const l = P.useContext(br);
  if (l === null)
    throw new Error(f1);
  return P.useMemo(() => ({
    getState: l.getState,
    setState: l.setState,
    subscribe: l.subscribe
  }), [l]);
}
const bv = { display: "none" }, O3 = {
  position: "absolute",
  width: 1,
  height: 1,
  margin: -1,
  border: 0,
  padding: 0,
  overflow: "hidden",
  clip: "rect(0px, 0px, 0px, 0px)",
  clipPath: "inset(100%)"
}, d1 = "react-flow__node-desc", h1 = "react-flow__edge-desc", D3 = "react-flow__aria-live", R3 = (l) => l.ariaLiveMessage, H3 = (l) => l.ariaLabelConfig;
function U3({ rfId: l }) {
  const i = Bt(R3);
  return W.jsx("div", { id: `${D3}-${l}`, "aria-live": "assertive", "aria-atomic": "true", style: O3, children: i });
}
function B3({ rfId: l, disableKeyboardA11y: i }) {
  const o = Bt(H3);
  return W.jsxs(W.Fragment, { children: [W.jsx("div", { id: `${d1}-${l}`, style: bv, children: i ? o["node.a11yDescription.default"] : o["node.a11yDescription.keyboardDisabled"] }), W.jsx("div", { id: `${h1}-${l}`, style: bv, children: o["edge.a11yDescription.default"] }), !i && W.jsx(U3, { rfId: l })] });
}
const Er = P.forwardRef(({ position: l = "top-left", children: i, className: o, style: r, ...s }, f) => {
  const d = `${l}`.split("-");
  return W.jsx("div", { className: ue(["react-flow__panel", o, ...d]), style: r, ref: f, ...s, children: i });
});
Er.displayName = "Panel";
const Ev = "https://reactflow.dev?utm_source=attribution";
function Y3({ proOptions: l, position: i = "bottom-right" }) {
  return P.useEffect(() => {
  }, []), l?.hideAttribution ? null : W.jsx(Er, { position: i, className: "react-flow__attribution", "data-message": `Please only hide this attribution when you are subscribed to React Flow Pro: ${Ev}`, children: W.jsx("a", { href: Ev, target: "_blank", rel: "noopener noreferrer", "aria-label": "React Flow attribution", children: "React Flow" }) });
}
const V3 = (l) => {
  const i = [], o = [];
  for (const [, r] of l.nodeLookup)
    r.selected && i.push(r.internals.userNode);
  for (const [, r] of l.edgeLookup)
    r.selected && o.push(r);
  return { selectedNodes: i, selectedEdges: o };
}, Qc = (l) => l.id;
function L3(l, i) {
  return kt(l.selectedNodes.map(Qc), i.selectedNodes.map(Qc)) && kt(l.selectedEdges.map(Qc), i.selectedEdges.map(Qc));
}
function q3({ onSelectionChange: l }) {
  const i = $t(), { selectedNodes: o, selectedEdges: r } = Bt(V3, L3);
  return P.useEffect(() => {
    const s = { nodes: o, edges: r };
    l?.(s), i.getState().onSelectionChangeHandlers.forEach((f) => f(s));
  }, [o, r, l]), null;
}
const X3 = (l) => !!l.onSelectionChangeHandlers;
function j3({ onSelectionChange: l }) {
  const i = Bt(X3);
  return l || i ? W.jsx(q3, { onSelectionChange: l }) : null;
}
const g1 = [0, 0], Z3 = { x: 0, y: 0, zoom: 1 }, G3 = [
  "nodes",
  "edges",
  "defaultNodes",
  "defaultEdges",
  "onConnect",
  "onConnectStart",
  "onConnectEnd",
  "onClickConnectStart",
  "onClickConnectEnd",
  "nodesDraggable",
  "autoPanOnNodeFocus",
  "nodesConnectable",
  "nodesFocusable",
  "edgesFocusable",
  "edgesReconnectable",
  "elevateNodesOnSelect",
  "elevateEdgesOnSelect",
  "minZoom",
  "maxZoom",
  "nodeExtent",
  "onNodesChange",
  "onEdgesChange",
  "elementsSelectable",
  "connectionMode",
  "snapGrid",
  "snapToGrid",
  "translateExtent",
  "connectOnClick",
  "defaultEdgeOptions",
  "fitView",
  "fitViewOptions",
  "onNodesDelete",
  "onEdgesDelete",
  "onDelete",
  "onNodeDrag",
  "onNodeDragStart",
  "onNodeDragStop",
  "onSelectionDrag",
  "onSelectionDragStart",
  "onSelectionDragStop",
  "onMoveStart",
  "onMove",
  "onMoveEnd",
  "noPanClassName",
  "nodeOrigin",
  "autoPanOnConnect",
  "autoPanOnNodeDrag",
  "onError",
  "connectionRadius",
  "isValidConnection",
  "selectNodesOnDrag",
  "nodeDragThreshold",
  "connectionDragThreshold",
  "onBeforeDelete",
  "debug",
  "autoPanSpeed",
  "ariaLabelConfig",
  "zIndexMode"
], _v = [...G3, "rfId"], Q3 = (l) => ({
  setNodes: l.setNodes,
  setEdges: l.setEdges,
  setMinZoom: l.setMinZoom,
  setMaxZoom: l.setMaxZoom,
  setTranslateExtent: l.setTranslateExtent,
  setNodeExtent: l.setNodeExtent,
  reset: l.reset,
  setDefaultNodesAndEdges: l.setDefaultNodesAndEdges
}), wv = {
  /*
   * these are values that are also passed directly to other components
   * than the StoreUpdater. We can reduce the number of setStore calls
   * by setting the same values here as prev fields.
   */
  translateExtent: Gu,
  nodeOrigin: g1,
  minZoom: 0.5,
  maxZoom: 2,
  elementsSelectable: !0,
  noPanClassName: "nopan",
  rfId: "1"
};
function K3(l) {
  const { setNodes: i, setEdges: o, setMinZoom: r, setMaxZoom: s, setTranslateExtent: f, setNodeExtent: d, reset: g, setDefaultNodesAndEdges: S } = Bt(Q3, kt), v = $t();
  P.useEffect(() => (S(l.defaultNodes, l.defaultEdges), () => {
    y.current = wv, g();
  }), []);
  const y = P.useRef(wv);
  return P.useEffect(
    () => {
      for (const m of _v) {
        const p = l[m], b = y.current[m];
        p !== b && (typeof l[m] > "u" || (m === "nodes" ? i(p) : m === "edges" ? o(p) : m === "minZoom" ? r(p) : m === "maxZoom" ? s(p) : m === "translateExtent" ? f(p) : m === "nodeExtent" ? d(p) : m === "ariaLabelConfig" ? v.setState({ ariaLabelConfig: Cw(p) }) : m === "fitView" ? v.setState({ fitViewQueued: p }) : m === "fitViewOptions" ? v.setState({ fitViewOptions: p }) : v.setState({ [m]: p })));
      }
      y.current = l;
    },
    // Only re-run the effect if one of the fields we track changes
    _v.map((m) => l[m])
  ), null;
}
function Nv() {
  return typeof window > "u" || !window.matchMedia ? null : window.matchMedia("(prefers-color-scheme: dark)");
}
function $3(l) {
  const [i, o] = P.useState(l === "system" ? null : l);
  return P.useEffect(() => {
    if (l !== "system") {
      o(l);
      return;
    }
    const r = Nv(), s = () => o(r?.matches ? "dark" : "light");
    return s(), r?.addEventListener("change", s), () => {
      r?.removeEventListener("change", s);
    };
  }, [l]), i !== null ? i : Nv()?.matches ? "dark" : "light";
}
const Tv = typeof document < "u" ? document : null;
function Ju(l = null, i = { target: Tv, actInsideInputWithModifier: !0 }) {
  const [o, r] = P.useState(!1), s = P.useRef(!1), f = P.useRef(/* @__PURE__ */ new Set([])), [d, g] = P.useMemo(() => {
    if (l !== null) {
      const v = (Array.isArray(l) ? l : [l]).filter((m) => typeof m == "string").map((m) => m.replace(/\+/g, `
`).replace(`

`, `
+`).split(`
`)), y = v.reduce((m, p) => m.concat(...p), []);
      return [v, y];
    }
    return [[], []];
  }, [l]);
  return P.useEffect(() => {
    const S = i?.target ?? Tv, v = i?.actInsideInputWithModifier ?? !0;
    if (l !== null) {
      const y = (b) => {
        if (s.current = b.ctrlKey || b.metaKey || b.shiftKey || b.altKey, (!s.current || s.current && !v) && $p(b))
          return !1;
        const C = zv(b.code, g);
        if (f.current.add(b[C]), Mv(d, f.current, !1)) {
          const N = b.composedPath?.()?.[0] || b.target, w = N?.nodeName === "BUTTON" || N?.nodeName === "A";
          i.preventDefault !== !1 && (s.current || !w) && b.preventDefault(), r(!0);
        }
      }, m = (b) => {
        const E = zv(b.code, g);
        Mv(d, f.current, !0) ? (r(!1), f.current.clear()) : f.current.delete(b[E]), b.key === "Meta" && f.current.clear(), s.current = !1;
      }, p = () => {
        f.current.clear(), r(!1);
      };
      return S?.addEventListener("keydown", y), S?.addEventListener("keyup", m), window.addEventListener("blur", p), window.addEventListener("contextmenu", p), () => {
        S?.removeEventListener("keydown", y), S?.removeEventListener("keyup", m), window.removeEventListener("blur", p), window.removeEventListener("contextmenu", p);
      };
    }
  }, [l, r]), o;
}
function Mv(l, i, o) {
  return l.filter((r) => o || r.length === i.size).some((r) => r.every((s) => i.has(s)));
}
function zv(l, i) {
  return i.includes(l) ? "code" : "key";
}
const J3 = () => {
  const l = $t();
  return P.useMemo(() => ({
    zoomIn: async (i) => {
      const { panZoom: o } = l.getState();
      return o ? o.scaleBy(1.2, i) : !1;
    },
    zoomOut: async (i) => {
      const { panZoom: o } = l.getState();
      return o ? o.scaleBy(1 / 1.2, i) : !1;
    },
    zoomTo: async (i, o) => {
      const { panZoom: r } = l.getState();
      return r ? r.scaleTo(i, o) : !1;
    },
    getZoom: () => l.getState().transform[2],
    setViewport: async (i, o) => {
      const { transform: [r, s, f], panZoom: d } = l.getState();
      return d ? (await d.setViewport({
        x: i.x ?? r,
        y: i.y ?? s,
        zoom: i.zoom ?? f
      }, o), !0) : !1;
    },
    getViewport: () => {
      const [i, o, r] = l.getState().transform;
      return { x: i, y: o, zoom: r };
    },
    setCenter: async (i, o, r) => l.getState().setCenter(i, o, r),
    fitBounds: async (i, o) => {
      const { width: r, height: s, minZoom: f, maxZoom: d, panZoom: g } = l.getState(), S = ch(i, r, s, f, d, o?.padding ?? 0.1);
      return g ? (await g.setViewport(S, {
        duration: o?.duration,
        ease: o?.ease,
        interpolate: o?.interpolate
      }), !0) : !1;
    },
    screenToFlowPosition: (i, o = {}) => {
      const { transform: r, snapGrid: s, snapToGrid: f, domNode: d } = l.getState();
      if (!d)
        return i;
      const { x: g, y: S } = d.getBoundingClientRect(), v = {
        x: i.x - g,
        y: i.y - S
      }, y = o.snapGrid ?? s, m = o.snapToGrid ?? f;
      return eo(v, r, m, y);
    },
    flowToScreenPosition: (i) => {
      const { transform: o, domNode: r } = l.getState();
      if (!r)
        return i;
      const { x: s, y: f } = r.getBoundingClientRect(), d = Oi(i, o);
      return {
        x: d.x + s,
        y: d.y + f
      };
    }
  }), []);
};
function m1(l, i) {
  const o = [], r = /* @__PURE__ */ new Map(), s = [];
  for (const f of l)
    if (f.type === "add") {
      s.push(f);
      continue;
    } else if (f.type === "remove" || f.type === "replace")
      r.set(f.id, [f]);
    else {
      const d = r.get(f.id);
      d ? d.push(f) : r.set(f.id, [f]);
    }
  for (const f of i) {
    const d = r.get(f.id);
    if (!d) {
      o.push(f);
      continue;
    }
    if (d[0].type === "remove")
      continue;
    if (d[0].type === "replace") {
      o.push({ ...d[0].item });
      continue;
    }
    const g = { ...f };
    for (const S of d)
      I3(S, g);
    o.push(g);
  }
  return s.length && s.forEach((f) => {
    f.index !== void 0 ? o.splice(f.index, 0, { ...f.item }) : o.push({ ...f.item });
  }), o;
}
function I3(l, i) {
  switch (l.type) {
    case "select": {
      i.selected = l.selected;
      break;
    }
    case "position": {
      typeof l.position < "u" && (i.position = l.position), typeof l.dragging < "u" && (i.dragging = l.dragging);
      break;
    }
    case "dimensions": {
      typeof l.dimensions < "u" && (i.measured = {
        ...l.dimensions
      }, l.setAttributes && ((l.setAttributes === !0 || l.setAttributes === "width") && (i.width = l.dimensions.width), (l.setAttributes === !0 || l.setAttributes === "height") && (i.height = l.dimensions.height))), typeof l.resizing == "boolean" && (i.resizing = l.resizing);
      break;
    }
  }
}
function y1(l, i) {
  return m1(l, i);
}
function k3(l, i) {
  return m1(l, i);
}
function ga(l, i) {
  return {
    id: l,
    type: "select",
    selected: i
  };
}
function xi(l, i = /* @__PURE__ */ new Set()) {
  const o = [];
  for (const [r, s] of l) {
    const f = i.has(r);
    !(s.selected === void 0 && !f) && s.selected !== f && o.push(ga(s.id, f));
  }
  return o;
}
function Cv({ items: l = [], lookup: i }) {
  const o = [], r = new Map(l.map((s) => [s.id, s]));
  for (const [s, f] of l.entries()) {
    const d = i.get(f.id), g = d?.internals?.userNode ?? d;
    g !== void 0 && g !== f && o.push({ id: f.id, item: f, type: "replace" }), g === void 0 && o.push({ item: f, type: "add", index: s });
  }
  for (const [s] of i)
    r.get(s) === void 0 && o.push({ id: s, type: "remove" });
  return o;
}
function Av(l) {
  return {
    id: l.id,
    type: "remove"
  };
}
const F3 = jp();
function W3(l, i, o = {}) {
  return Uw(l, i, {
    ...o,
    onError: o.onError ?? F3
  });
}
const Ov = (l) => xw(l), P3 = (l) => Yp(l);
function v1(l) {
  return P.forwardRef(l);
}
const p1 = typeof window < "u" ? P.useLayoutEffect : P.useEffect;
function Dv(l) {
  const [i, o] = P.useState(BigInt(0)), [r] = P.useState(() => tN(() => o((s) => s + BigInt(1))));
  return p1(() => {
    const s = r.get();
    s.length && (l(s), r.reset());
  }, [i]), r;
}
function tN(l) {
  let i = [];
  return {
    get: () => i,
    reset: () => {
      i = [];
    },
    push: (o) => {
      i.push(o), l();
    }
  };
}
const S1 = P.createContext(null);
function eN({ children: l }) {
  const i = $t(), o = P.useCallback((g) => {
    const { nodes: S = [], setNodes: v, hasDefaultNodes: y, onNodesChange: m, nodeLookup: p, fitViewQueued: b, onNodesChangeMiddlewareMap: E } = i.getState();
    let C = S;
    for (const w of g)
      C = typeof w == "function" ? w(C) : w;
    let N = Cv({
      items: C,
      lookup: p
    });
    for (const w of E.values())
      N = w(N);
    y && v(C), N.length > 0 ? m?.(N) : b && window.requestAnimationFrame(() => {
      const { fitViewQueued: w, nodes: U, setNodes: _ } = i.getState();
      w && _(U);
    });
  }, []), r = Dv(o), s = P.useCallback((g) => {
    const { edges: S = [], setEdges: v, hasDefaultEdges: y, onEdgesChange: m, edgeLookup: p } = i.getState();
    let b = S;
    for (const E of g)
      b = typeof E == "function" ? E(b) : E;
    y ? v(b) : m && m(Cv({
      items: b,
      lookup: p
    }));
  }, []), f = Dv(s), d = P.useMemo(() => ({ nodeQueue: r, edgeQueue: f }), []);
  return W.jsx(S1.Provider, { value: d, children: l });
}
function nN() {
  const l = P.useContext(S1);
  if (!l)
    throw new Error("useBatchContext must be used within a BatchProvider");
  return l;
}
const lN = (l) => !!l.panZoom;
function mh() {
  const l = J3(), i = $t(), o = nN(), r = Bt(lN), s = P.useMemo(() => {
    const f = (m) => i.getState().nodeLookup.get(m), d = (m) => {
      o.nodeQueue.push(m);
    }, g = (m) => {
      o.edgeQueue.push(m);
    }, S = (m) => {
      const { nodeLookup: p, nodeOrigin: b } = i.getState(), E = Ov(m) ? m : p.get(m.id), C = E.parentId ? Gp(E.position, E.measured, E.parentId, p, b) : E.position, N = {
        ...E,
        position: C,
        width: E.measured?.width ?? E.width,
        height: E.measured?.height ?? E.height
      };
      return Ku(N, E.parentId ? void 0 : b);
    }, v = (m, p, b = { replace: !1 }) => {
      d((E) => E.map((C) => {
        if (C.id === m) {
          const N = typeof p == "function" ? p(C) : p;
          return b.replace && Ov(N) ? N : { ...C, ...N };
        }
        return C;
      }));
    }, y = (m, p, b = { replace: !1 }) => {
      g((E) => E.map((C) => {
        if (C.id === m) {
          const N = typeof p == "function" ? p(C) : p;
          return b.replace && P3(N) ? N : { ...C, ...N };
        }
        return C;
      }));
    };
    return {
      getNodes: () => i.getState().nodes.map((m) => ({ ...m })),
      getNode: (m) => f(m)?.internals.userNode,
      getInternalNode: f,
      getEdges: () => {
        const { edges: m = [] } = i.getState();
        return m.map((p) => ({ ...p }));
      },
      getEdge: (m) => i.getState().edgeLookup.get(m),
      setNodes: d,
      setEdges: g,
      addNodes: (m) => {
        const p = Array.isArray(m) ? m : [m];
        o.nodeQueue.push((b) => [...b, ...p]);
      },
      addEdges: (m) => {
        const p = Array.isArray(m) ? m : [m];
        o.edgeQueue.push((b) => [...b, ...p]);
      },
      toObject: () => {
        const { nodes: m = [], edges: p = [], transform: b } = i.getState(), [E, C, N] = b;
        return {
          nodes: m.map((w) => ({ ...w })),
          edges: p.map((w) => ({ ...w })),
          viewport: {
            x: E,
            y: C,
            zoom: N
          }
        };
      },
      deleteElements: async ({ nodes: m = [], edges: p = [] }) => {
        const { nodes: b, edges: E, onNodesDelete: C, onEdgesDelete: N, triggerNodeChanges: w, triggerEdgeChanges: U, onDelete: _, onBeforeDelete: A } = i.getState(), { nodes: j, edges: B } = await Nw({
          nodesToRemove: m,
          edgesToRemove: p,
          nodes: b,
          edges: E,
          onBeforeDelete: A
        }), R = B.length > 0, Z = j.length > 0;
        if (R) {
          const J = B.map(Av);
          N?.(B), U(J);
        }
        if (Z) {
          const J = j.map(Av);
          C?.(j), w(J);
        }
        return (Z || R) && _?.({ nodes: j, edges: B }), { deletedNodes: j, deletedEdges: B };
      },
      /**
       * Partial is defined as "the 2 nodes/areas are intersecting partially".
       * If a is contained in b or b is contained in a, they are both
       * considered fully intersecting.
       */
      getIntersectingNodes: (m, p = !0, b) => {
        const E = nv(m), C = E ? m : S(m), N = b !== void 0;
        if (!C)
          return [];
        const { nodeOrigin: w } = i.getState();
        return (b || i.getState().nodes).filter((U) => {
          const _ = i.getState().nodeLookup.get(U.id);
          if (_ && !E && (U.id === m.id || !_.internals.positionAbsolute))
            return !1;
          const A = Ku(N ? U : _, w), j = cr(A, C);
          return p && j > 0 || j >= A.width * A.height || j >= C.width * C.height;
        });
      },
      isNodeIntersecting: (m, p, b = !0) => {
        const C = nv(m) ? m : S(m);
        if (!C)
          return !1;
        const N = cr(C, p);
        return b && N > 0 || N >= p.width * p.height || N >= C.width * C.height;
      },
      updateNode: v,
      updateNodeData: (m, p, b = { replace: !1 }) => {
        v(m, (E) => {
          const C = typeof p == "function" ? p(E) : p;
          return b.replace ? { ...E, data: C } : { ...E, data: { ...E.data, ...C } };
        }, b);
      },
      updateEdge: y,
      updateEdgeData: (m, p, b = { replace: !1 }) => {
        y(m, (E) => {
          const C = typeof p == "function" ? p(E) : p;
          return b.replace ? { ...E, data: C } : { ...E, data: { ...E.data, ...C } };
        }, b);
      },
      getNodesBounds: (m) => {
        const { nodeLookup: p, nodeOrigin: b } = i.getState();
        return bw(m, { nodeLookup: p, nodeOrigin: b });
      },
      getHandleConnections: ({ type: m, id: p, nodeId: b }) => Array.from(i.getState().connectionLookup.get(`${b}-${m}${p ? `-${p}` : ""}`)?.values() ?? []),
      getNodeConnections: ({ type: m, handleId: p, nodeId: b }) => Array.from(i.getState().connectionLookup.get(`${b}${m ? p ? `-${m}-${p}` : `-${m}` : ""}`)?.values() ?? []),
      fitView: async (m) => {
        const p = i.getState().fitViewResolver ?? zw();
        return i.setState({ fitViewQueued: !0, fitViewOptions: m, fitViewResolver: p }), o.nodeQueue.push((b) => [...b]), p.promise;
      }
    };
  }, []);
  return P.useMemo(() => ({
    ...s,
    ...l,
    viewportInitialized: r
  }), [r]);
}
const Rv = (l) => l.selected, aN = typeof window < "u" ? window : void 0;
function iN({ deleteKeyCode: l, multiSelectionKeyCode: i }) {
  const o = $t(), { deleteElements: r } = mh(), s = Ju(l, { actInsideInputWithModifier: !1 }), f = Ju(i, { target: aN });
  P.useEffect(() => {
    if (s) {
      const { edges: d, nodes: g } = o.getState();
      r({ nodes: g.filter(Rv), edges: d.filter(Rv) }), o.setState({ nodesSelectionActive: !1 });
    }
  }, [s]), P.useEffect(() => {
    o.setState({ multiSelectionActive: f });
  }, [f]);
}
function uN(l) {
  const i = $t();
  P.useEffect(() => {
    const o = () => {
      if (!l.current || !(l.current.checkVisibility?.() ?? !0))
        return !1;
      const r = rh(l.current);
      (r.height === 0 || r.width === 0) && i.getState().onError?.("004", Sn.error004()), i.setState({ width: r.width || 500, height: r.height || 500 });
    };
    if (l.current) {
      o(), window.addEventListener("resize", o);
      const r = new ResizeObserver(() => o());
      return r.observe(l.current), () => {
        window.removeEventListener("resize", o), r.disconnect();
      };
    }
  }, []);
}
const _r = {
  position: "absolute",
  width: "100%",
  height: "100%",
  top: 0,
  left: 0
}, oN = (l) => ({
  userSelectionActive: l.userSelectionActive,
  lib: l.lib,
  connectionInProgress: l.connection.inProgress
});
function cN({ onPaneContextMenu: l, zoomOnScroll: i = !0, zoomOnPinch: o = !0, panOnScroll: r = !1, panActivationKeyPressed: s, panOnScrollSpeed: f = 0.5, panOnScrollMode: d = pa.Free, zoomOnDoubleClick: g = !0, panOnDrag: S = !0, defaultViewport: v, translateExtent: y, minZoom: m, maxZoom: p, zoomActivationKeyCode: b, preventScrolling: E = !0, children: C, noWheelClassName: N, noPanClassName: w, onViewportChange: U, isControlledViewport: _, paneClickDistance: A, selectionOnDrag: j }) {
  const B = $t(), R = P.useRef(null), { userSelectionActive: Z, lib: J, connectionInProgress: it } = Bt(oN, kt), tt = Ju(b), ot = P.useRef();
  uN(R);
  const lt = P.useCallback((M) => {
    U?.({ x: M[0], y: M[1], zoom: M[2] }), _ || B.setState({ transform: M });
  }, [U, _]);
  return P.useEffect(() => {
    if (R.current) {
      ot.current = d3({
        domNode: R.current,
        minZoom: m,
        maxZoom: p,
        translateExtent: y,
        viewport: v,
        onDraggingChange: (H) => B.setState((X) => X.paneDragging === H ? X : { paneDragging: H }),
        onPanZoomStart: (H, X) => {
          const { onViewportChangeStart: K, onMoveStart: F } = B.getState();
          F?.(H, X), K?.(X);
        },
        onPanZoom: (H, X) => {
          const { onViewportChange: K, onMove: F } = B.getState();
          F?.(H, X), K?.(X);
        },
        onPanZoomEnd: (H, X) => {
          const { onViewportChangeEnd: K, onMoveEnd: F } = B.getState();
          F?.(H, X), K?.(X);
        }
      });
      const { x: M, y: V, zoom: O } = ot.current.getViewport();
      return B.setState({
        panZoom: ot.current,
        transform: [M, V, O],
        domNode: R.current.closest(".react-flow")
      }), () => {
        ot.current?.destroy();
      };
    }
  }, []), P.useEffect(() => {
    ot.current?.update({
      onPaneContextMenu: l,
      zoomOnScroll: i,
      zoomOnPinch: o,
      panOnScroll: r,
      panActivationKeyPressed: s,
      panOnScrollSpeed: f,
      panOnScrollMode: d,
      zoomOnDoubleClick: g,
      panOnDrag: S,
      zoomActivationKeyPressed: tt,
      preventScrolling: E,
      noPanClassName: w,
      userSelectionActive: Z,
      noWheelClassName: N,
      lib: J,
      onTransformChange: lt,
      connectionInProgress: it,
      selectionOnDrag: j,
      paneClickDistance: A
    });
  }, [
    l,
    i,
    o,
    r,
    s,
    f,
    d,
    g,
    S,
    tt,
    E,
    w,
    Z,
    N,
    J,
    lt,
    it,
    j,
    A
  ]), W.jsx("div", { className: "react-flow__renderer", ref: R, style: _r, children: C });
}
const rN = (l) => ({
  userSelectionActive: l.userSelectionActive,
  userSelectionRect: l.userSelectionRect
});
function sN() {
  const { userSelectionActive: l, userSelectionRect: i } = Bt(rN, kt);
  return l && i ? W.jsx("div", { className: "react-flow__selection react-flow__container", style: {
    width: i.width,
    height: i.height,
    transform: `translate(${i.x}px, ${i.y}px)`
  } }) : null;
}
const Ad = (l, i) => (o) => {
  o.target === i.current && l?.(o);
}, fN = (l) => ({
  userSelectionActive: l.userSelectionActive,
  elementsSelectable: l.elementsSelectable,
  dragging: l.paneDragging,
  panBy: l.panBy,
  autoPanSpeed: l.autoPanSpeed
});
function dN({ isSelecting: l, selectionKeyPressed: i, selectionMode: o = Qu.Full, panOnDrag: r, autoPanOnSelection: s, paneClickDistance: f, selectionOnDrag: d, onSelectionStart: g, onSelectionEnd: S, onPaneClick: v, onPaneContextMenu: y, onPaneScroll: m, onPaneMouseEnter: p, onPaneMouseMove: b, onPaneMouseLeave: E, children: C }) {
  const N = P.useRef(0), w = $t(), { userSelectionActive: U, elementsSelectable: _, dragging: A, panBy: j, autoPanSpeed: B } = Bt(fN, kt), R = _ && (l || U), Z = P.useRef(null), J = P.useRef(), it = P.useRef(/* @__PURE__ */ new Set()), tt = P.useRef(/* @__PURE__ */ new Set()), ot = P.useRef(!1), lt = P.useRef(!1), M = P.useRef({ x: 0, y: 0 }), V = P.useRef(!1), O = (I) => {
    if (lt.current || ot.current || w.getState().connection.inProgress) {
      lt.current = !1, ot.current = !1;
      return;
    }
    const { connectionClickStartHandle: ft, connection: gt, onClickConnectEnd: ct, resetSelectedElements: rt } = w.getState();
    if (ft) {
      const vt = structuredClone(gt);
      delete vt.inProgress, vt.toPosition = vt.toHandle ? vt.toHandle.position : null, ct?.(I.nativeEvent, vt), w.setState({ connectionClickStartHandle: null });
    }
    v?.(I), rt(), w.setState({ nodesSelectionActive: !1 });
  }, H = (I) => {
    if (Array.isArray(r) && r?.includes(2)) {
      I.preventDefault();
      return;
    }
    y?.(I);
  }, X = m ? (I) => m(I) : void 0, K = (I) => {
    lt.current && (I.stopPropagation(), lt.current = !1);
  }, F = (I) => {
    if (I.pointerType === "touch" && r !== !1 && !i)
      return;
    const { domNode: ft, transform: gt } = w.getState();
    if (J.current = ft?.getBoundingClientRect(), !J.current)
      return;
    const ct = I.target === Z.current;
    if (!ct && !!I.target.closest(".nokey") || !l || !(d && ct || i) || I.button !== 0 || !I.isPrimary)
      return;
    I.target?.setPointerCapture?.(I.pointerId), lt.current = !1;
    const { x: wt, y: _t } = pn(I.nativeEvent, J.current), Mt = eo({ x: wt, y: _t }, gt);
    w.setState({
      userSelectionRect: {
        width: 0,
        height: 0,
        startX: Mt.x,
        startY: Mt.y,
        x: wt,
        y: _t
      }
    }), ct || (I.stopPropagation(), I.preventDefault());
  };
  function at(I, ft) {
    const { userSelectionRect: gt } = w.getState();
    if (!gt)
      return;
    const { transform: ct, nodeLookup: rt, edgeLookup: vt, connectionLookup: wt, triggerNodeChanges: _t, triggerEdgeChanges: Mt, defaultEdgeOptions: Ht } = w.getState(), Ot = { x: gt.startX, y: gt.startY }, { x: Pt, y: xe } = Oi(Ot, ct), re = {
      startX: Ot.x,
      startY: Ot.y,
      x: I < Pt ? I : Pt,
      y: ft < xe ? ft : xe,
      width: Math.abs(I - Pt),
      height: Math.abs(ft - xe)
    }, En = it.current, Ie = tt.current;
    it.current = new Set(uh(rt, re, ct, o === Qu.Partial, !0).map((_e) => _e.id)), tt.current = /* @__PURE__ */ new Set();
    const Oe = Ht?.selectable ?? !0;
    for (const _e of it.current) {
      const De = wt.get(_e);
      if (De)
        for (const { edgeId: Ve } of De.values()) {
          const _n = vt.get(Ve);
          _n && (_n.selectable ?? Oe) && tt.current.add(Ve);
        }
    }
    if (!lv(En, it.current)) {
      const _e = xi(rt, it.current);
      _t(_e);
    }
    if (!lv(Ie, tt.current)) {
      const _e = xi(vt, tt.current);
      Mt(_e);
    }
    w.setState({
      userSelectionRect: re,
      userSelectionActive: !0,
      nodesSelectionActive: !1
    });
  }
  function dt() {
    if (!s || !J.current)
      return;
    const [I, ft] = oh(M.current, J.current, B);
    j({ x: I, y: ft }).then((gt) => {
      if (!lt.current || !gt) {
        N.current = requestAnimationFrame(dt);
        return;
      }
      const { x: ct, y: rt } = M.current;
      at(ct, rt), N.current = requestAnimationFrame(dt);
    });
  }
  const pt = () => {
    cancelAnimationFrame(N.current), N.current = 0, V.current = !1;
  };
  P.useEffect(() => () => pt(), []);
  const T = (I) => {
    const { userSelectionRect: ft, transform: gt, resetSelectedElements: ct } = w.getState();
    if (!J.current || !ft)
      return;
    const { x: rt, y: vt } = pn(I.nativeEvent, J.current);
    M.current = { x: rt, y: vt };
    const wt = Oi({ x: ft.startX, y: ft.startY }, gt);
    if (!lt.current) {
      const _t = i ? 0 : f;
      if (Math.hypot(rt - wt.x, vt - wt.y) <= _t)
        return;
      ct(), g?.(I);
    }
    lt.current = !0, V.current || (dt(), V.current = !0), at(rt, vt);
  }, k = (I) => {
    if (!R) {
      I.target === Z.current && w.getState().connection.inProgress && (ot.current = !0);
      return;
    }
    I.button === 0 && (I.target?.releasePointerCapture?.(I.pointerId), !U && I.target === Z.current && w.getState().userSelectionRect && O?.(I), w.setState({
      userSelectionActive: !1,
      userSelectionRect: null
    }), lt.current && (S?.(I), w.setState({
      nodesSelectionActive: it.current.size > 0
    })), pt());
  }, st = (I) => {
    I.target?.releasePointerCapture?.(I.pointerId), pt();
  }, ut = r === !0 || Array.isArray(r) && r.includes(0);
  return W.jsxs("div", { className: ue(["react-flow__pane", { draggable: ut, dragging: A, selection: l }]), onClick: R ? void 0 : Ad(O, Z), onContextMenu: Ad(H, Z), onWheel: Ad(X, Z), onPointerEnter: R ? void 0 : p, onPointerMove: R ? T : b, onPointerUp: k, onPointerCancel: R ? st : void 0, onPointerDownCapture: R ? F : void 0, onClickCapture: R ? K : void 0, onPointerLeave: E, ref: Z, style: _r, children: [C, W.jsx(sN, {})] });
}
function Kd({ id: l, store: i, unselect: o = !1, nodeRef: r }) {
  const { addSelectedNodes: s, unselectNodesAndEdges: f, multiSelectionActive: d, nodeLookup: g, onError: S } = i.getState(), v = g.get(l);
  if (!v) {
    S?.("012", Sn.error012(l));
    return;
  }
  i.setState({ nodesSelectionActive: !1 }), v.selected ? (o || v.selected && d) && (f({ nodes: [v], edges: [] }), requestAnimationFrame(() => r?.current?.blur())) : s([l]);
}
function x1({ nodeRef: l, disabled: i = !1, noDragClassName: o, handleSelector: r, nodeId: s, isSelectable: f, nodeClickDistance: d }) {
  const g = $t(), [S, v] = P.useState(!1), y = P.useRef();
  return P.useEffect(() => {
    if (!i)
      return y.current = Ww({
        getStoreItems: () => g.getState(),
        onNodeMouseDown: (m) => {
          Kd({
            id: m,
            store: g,
            nodeRef: l
          });
        },
        onDragStart: () => {
          v(!0);
        },
        onDragStop: () => {
          v(!1);
        }
      }), () => {
        y.current?.destroy(), y.current = void 0;
      };
  }, [i, g, l]), P.useEffect(() => {
    i || !l.current || !y.current || y.current.update({
      noDragClassName: o,
      handleSelector: r,
      domNode: l.current,
      isSelectable: f,
      nodeId: s,
      nodeClickDistance: d
    });
  }, [o, r, i, f, l, s, d]), S;
}
const hN = (l) => (i) => i.selected && (i.draggable || l && typeof i.draggable > "u");
function b1() {
  const l = $t();
  return P.useCallback((o) => {
    const { nodeExtent: r, snapToGrid: s, snapGrid: f, nodesDraggable: d, onError: g, updateNodePositions: S, nodeLookup: v, nodeOrigin: y } = l.getState(), m = /* @__PURE__ */ new Map(), p = hN(d), b = s ? f[0] : 5, E = s ? f[1] : 5, C = o.direction.x * b * o.factor, N = o.direction.y * E * o.factor;
    for (const [, w] of v) {
      if (!p(w))
        continue;
      let U = {
        x: w.internals.positionAbsolute.x + C,
        y: w.internals.positionAbsolute.y + N
      };
      s && (U = to(U, f));
      const { position: _, positionAbsolute: A } = Vp({
        nodeId: w.id,
        nextPosition: U,
        nodeLookup: v,
        nodeExtent: r,
        nodeOrigin: y,
        onError: g
      });
      w.position = _, w.internals.positionAbsolute = A, m.set(w.id, w);
    }
    S(m);
  }, []);
}
const yh = P.createContext(null), gN = yh.Provider;
yh.Consumer;
const E1 = () => P.useContext(yh), mN = (l) => ({
  connectOnClick: l.connectOnClick,
  noPanClassName: l.noPanClassName,
  rfId: l.rfId
}), _1 = P.createContext(null);
function yN({ children: l }) {
  const i = Bt(mN, kt);
  return W.jsx(_1.Provider, { value: i, children: l });
}
function vN() {
  const l = P.useContext(_1);
  if (!l)
    throw new Error("useHandleConfig must be used within a HandleConfigProvider");
  return l;
}
const pN = {
  connectingFrom: !1,
  connectingTo: !1,
  clickConnecting: !1,
  isPossibleEndHandle: !0,
  connectionInProcess: !1,
  clickConnectionInProcess: !1,
  valid: !1
}, SN = (l, i, o) => (r) => {
  const { connectionClickStartHandle: s, connectionMode: f, connection: d } = r, { fromHandle: g, toHandle: S, isValid: v } = d;
  if (!g && !s)
    return pN;
  const y = S?.nodeId === l && S?.id === i && S?.type === o;
  return {
    connectingFrom: g?.nodeId === l && g?.id === i && g?.type === o,
    connectingTo: y,
    clickConnecting: s?.nodeId === l && s?.id === i && s?.type === o,
    isPossibleEndHandle: f === Ci.Strict ? g?.type !== o : l !== g?.nodeId || i !== g?.id,
    connectionInProcess: !!g,
    clickConnectionInProcess: !!s,
    valid: y && v
  };
};
function xN({ type: l = "source", position: i = xt.Top, isValidConnection: o, isConnectable: r = !0, isConnectableStart: s = !0, isConnectableEnd: f = !0, id: d, onConnect: g, children: S, className: v, onMouseDown: y, onTouchStart: m, ...p }, b) {
  const E = d || null, C = l === "target", N = $t(), w = E1(), { connectOnClick: U, noPanClassName: _, rfId: A } = vN(), { connectingFrom: j, connectingTo: B, clickConnecting: R, isPossibleEndHandle: Z, connectionInProcess: J, clickConnectionInProcess: it, valid: tt } = Bt(SN(w, E, l), kt);
  w || N.getState().onError?.("010", Sn.error010());
  const ot = (V) => {
    const { defaultEdgeOptions: O, onConnect: H, hasDefaultEdges: X } = N.getState(), K = {
      ...O,
      ...V
    };
    if (X) {
      const { edges: F, setEdges: at, onError: dt } = N.getState();
      at(W3(K, F, { onError: dt }));
    }
    H?.(K), g?.(K);
  }, lt = (V) => {
    if (!w)
      return;
    const O = Jp(V.nativeEvent);
    if (s && (O && V.button === 0 || !O)) {
      const H = N.getState();
      Qd.onPointerDown(V.nativeEvent, {
        handleDomNode: V.currentTarget,
        autoPanOnConnect: H.autoPanOnConnect,
        connectionMode: H.connectionMode,
        connectionRadius: H.connectionRadius,
        domNode: H.domNode,
        nodeLookup: H.nodeLookup,
        lib: H.lib,
        isTarget: C,
        handleId: E,
        nodeId: w,
        flowId: H.rfId,
        panBy: H.panBy,
        cancelConnection: H.cancelConnection,
        onConnectStart: H.onConnectStart,
        onConnectEnd: (...X) => N.getState().onConnectEnd?.(...X),
        updateConnection: H.updateConnection,
        onConnect: ot,
        isValidConnection: o || ((...X) => N.getState().isValidConnection?.(...X) ?? !0),
        getTransform: () => N.getState().transform,
        getFromHandle: () => N.getState().connection.fromHandle,
        autoPanSpeed: H.autoPanSpeed,
        dragThreshold: H.connectionDragThreshold
      });
    }
    O ? y?.(V) : m?.(V);
  }, M = (V) => {
    const { onClickConnectStart: O, onClickConnectEnd: H, connectionClickStartHandle: X, connectionMode: K, isValidConnection: F, lib: at, rfId: dt, nodeLookup: pt, connection: T } = N.getState();
    if (!w || !X && !s)
      return;
    if (!X) {
      O?.(V.nativeEvent, { nodeId: w, handleId: E, handleType: l }), N.setState({ connectionClickStartHandle: { nodeId: w, type: l, id: E } });
      return;
    }
    const k = Kp(V.target), st = o || F, { connection: ut, isValid: I } = Qd.isValid(V.nativeEvent, {
      handle: {
        nodeId: w,
        id: E,
        type: l
      },
      connectionMode: K,
      fromNodeId: X.nodeId,
      fromHandleId: X.id || null,
      fromType: X.type,
      isValidConnection: st,
      flowId: dt,
      doc: k,
      lib: at,
      nodeLookup: pt
    });
    I && ut && ot(ut);
    const ft = structuredClone(T);
    delete ft.inProgress, ft.toPosition = ft.toHandle ? ft.toHandle.position : null, H?.(V, ft), N.setState({ connectionClickStartHandle: null });
  };
  return W.jsx("div", { "data-handleid": E, "data-nodeid": w, "data-handlepos": i, "data-id": `${A}-${w}-${E}-${l}`, className: ue([
    "react-flow__handle",
    `react-flow__handle-${i}`,
    "nodrag",
    _,
    v,
    {
      source: !C,
      target: C,
      connectable: r,
      connectablestart: s,
      connectableend: f,
      clickconnecting: R,
      connectingfrom: j,
      connectingto: B,
      valid: tt,
      /*
       * shows where you can start a connection from
       * and where you can end it while connecting
       */
      connectionindicator: r && (!J || Z) && (J || it ? f : s)
    }
  ]), onMouseDown: lt, onTouchStart: lt, onClick: U ? M : void 0, ref: b, ...p, children: S });
}
const rr = P.memo(v1(xN));
function bN({ data: l, isConnectable: i, sourcePosition: o = xt.Bottom }) {
  return W.jsxs(W.Fragment, { children: [l?.label, W.jsx(rr, { type: "source", position: o, isConnectable: i })] });
}
function EN({ data: l, isConnectable: i, targetPosition: o = xt.Top, sourcePosition: r = xt.Bottom }) {
  return W.jsxs(W.Fragment, { children: [W.jsx(rr, { type: "target", position: o, isConnectable: i }), l?.label, W.jsx(rr, { type: "source", position: r, isConnectable: i })] });
}
function _N() {
  return null;
}
function wN({ data: l, isConnectable: i, targetPosition: o = xt.Top }) {
  return W.jsxs(W.Fragment, { children: [W.jsx(rr, { type: "target", position: o, isConnectable: i }), l?.label] });
}
const sr = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 }
}, Hv = {
  input: bN,
  default: EN,
  output: wN,
  group: _N
};
function NN(l) {
  return l.internals.handleBounds === void 0 ? {
    width: l.width ?? l.initialWidth ?? l.style?.width,
    height: l.height ?? l.initialHeight ?? l.style?.height
  } : {
    width: l.width ?? l.style?.width,
    height: l.height ?? l.style?.height
  };
}
const TN = (l) => {
  const { width: i, height: o, x: r, y: s } = Pu(l.nodeLookup, {
    filter: (f) => !!f.selected
  });
  return {
    width: vn(i) ? i : null,
    height: vn(o) ? o : null,
    userSelectionActive: l.userSelectionActive,
    transformString: `translate(${l.transform[0]}px,${l.transform[1]}px) scale(${l.transform[2]}) translate(${r}px,${s}px)`
  };
};
function MN({ onSelectionContextMenu: l, noPanClassName: i, disableKeyboardA11y: o }) {
  const r = $t(), { width: s, height: f, transformString: d, userSelectionActive: g } = Bt(TN, kt), S = b1(), v = P.useRef(null);
  P.useEffect(() => {
    o || v.current?.focus({
      preventScroll: !0
    });
  }, [o]);
  const y = !g && s !== null && f !== null;
  if (x1({
    nodeRef: v,
    disabled: !y
  }), !y)
    return null;
  const m = l ? (b) => {
    const E = r.getState().nodes.filter((C) => C.selected);
    l(b, E);
  } : void 0, p = (b) => {
    Object.prototype.hasOwnProperty.call(sr, b.key) && (b.preventDefault(), S({
      direction: sr[b.key],
      factor: b.shiftKey ? 4 : 1
    }));
  };
  return W.jsx("div", { className: ue(["react-flow__nodesselection", "react-flow__container", i]), style: {
    transform: d
  }, children: W.jsx("div", { ref: v, className: "react-flow__nodesselection-rect", onContextMenu: m, tabIndex: o ? void 0 : -1, onKeyDown: o ? void 0 : p, style: {
    width: s,
    height: f
  } }) });
}
const Uv = typeof window < "u" ? window : void 0, zN = (l) => ({ nodesSelectionActive: l.nodesSelectionActive, userSelectionActive: l.userSelectionActive });
function w1({ children: l, onPaneClick: i, onPaneMouseEnter: o, onPaneMouseMove: r, onPaneMouseLeave: s, onPaneContextMenu: f, onPaneScroll: d, paneClickDistance: g, deleteKeyCode: S, selectionKeyCode: v, selectionOnDrag: y, selectionMode: m, onSelectionStart: p, onSelectionEnd: b, multiSelectionKeyCode: E, panActivationKeyCode: C, zoomActivationKeyCode: N, elementsSelectable: w, zoomOnScroll: U, zoomOnPinch: _, panOnScroll: A, panOnScrollSpeed: j, panOnScrollMode: B, zoomOnDoubleClick: R, panOnDrag: Z, autoPanOnSelection: J, defaultViewport: it, translateExtent: tt, minZoom: ot, maxZoom: lt, preventScrolling: M, onSelectionContextMenu: V, noWheelClassName: O, noPanClassName: H, disableKeyboardA11y: X, onViewportChange: K, isControlledViewport: F }) {
  const { nodesSelectionActive: at, userSelectionActive: dt } = Bt(zN, kt), pt = Ju(v, { target: Uv }), T = Ju(C, { target: Uv }), k = T || Z, st = T || A, ut = y && k !== !0, I = pt || dt || ut;
  return iN({ deleteKeyCode: S, multiSelectionKeyCode: E }), W.jsx(cN, { onPaneContextMenu: f, elementsSelectable: w, zoomOnScroll: U, zoomOnPinch: _, panOnScroll: st, panActivationKeyPressed: T, panOnScrollSpeed: j, panOnScrollMode: B, zoomOnDoubleClick: R, panOnDrag: !pt && k, defaultViewport: it, translateExtent: tt, minZoom: ot, maxZoom: lt, zoomActivationKeyCode: N, preventScrolling: M, noWheelClassName: O, noPanClassName: H, onViewportChange: K, isControlledViewport: F, paneClickDistance: g, selectionOnDrag: ut, children: W.jsxs(dN, { onSelectionStart: p, onSelectionEnd: b, onPaneClick: i, onPaneMouseEnter: o, onPaneMouseMove: r, onPaneMouseLeave: s, onPaneContextMenu: f, onPaneScroll: d, panOnDrag: k, autoPanOnSelection: J, isSelecting: !!I, selectionMode: m, selectionKeyPressed: pt, paneClickDistance: g, selectionOnDrag: ut, children: [l, at && W.jsx(MN, { onSelectionContextMenu: V, noPanClassName: H, disableKeyboardA11y: X })] }) });
}
w1.displayName = "FlowRenderer";
const CN = P.memo(w1), AN = (l) => (i) => l ? uh(i.nodeLookup, { x: 0, y: 0, width: i.width, height: i.height }, i.transform, !0).map((o) => o.id) : Array.from(i.nodeLookup.keys());
function ON(l) {
  return Bt(P.useCallback(AN(l), [l]), kt);
}
const DN = (l) => l.updateNodeInternals;
function RN() {
  const l = Bt(DN), [i] = P.useState(() => typeof ResizeObserver > "u" ? null : new ResizeObserver((o) => {
    const r = /* @__PURE__ */ new Map();
    o.forEach((s) => {
      const f = s.target.getAttribute("data-id");
      r.set(f, {
        id: f,
        nodeElement: s.target,
        force: !0
      });
    }), l(r);
  }));
  return P.useEffect(() => () => {
    i?.disconnect();
  }, [i]), i;
}
function HN({ node: l, nodeType: i, hasDimensions: o, resizeObserver: r }) {
  const s = $t(), f = P.useRef(null), d = P.useRef(null), g = P.useRef(l.sourcePosition), S = P.useRef(l.targetPosition), v = P.useRef(i), y = o && !!l.internals.handleBounds;
  return P.useEffect(() => {
    f.current && !l.hidden && (!y || d.current !== f.current) && (d.current && r?.unobserve(d.current), r?.observe(f.current), d.current = f.current);
  }, [y, l.hidden]), P.useEffect(() => () => {
    d.current && (r?.unobserve(d.current), d.current = null);
  }, []), P.useEffect(() => {
    if (f.current) {
      const m = v.current !== i, p = g.current !== l.sourcePosition, b = S.current !== l.targetPosition;
      (m || p || b) && (v.current = i, g.current = l.sourcePosition, S.current = l.targetPosition, s.getState().updateNodeInternals(/* @__PURE__ */ new Map([[l.id, { id: l.id, nodeElement: f.current, force: !0 }]])));
    }
  }, [l.id, i, l.sourcePosition, l.targetPosition]), f;
}
function UN({ id: l, onClick: i, onMouseEnter: o, onMouseMove: r, onMouseLeave: s, onContextMenu: f, onDoubleClick: d, nodesDraggable: g, elementsSelectable: S, nodesConnectable: v, nodesFocusable: y, resizeObserver: m, noDragClassName: p, noPanClassName: b, disableKeyboardA11y: E, rfId: C, nodeTypes: N, nodeClickDistance: w, onError: U }) {
  const { node: _, internals: A, isParent: j } = Bt((I) => {
    const ft = I.nodeLookup.get(l), gt = I.parentLookup.has(l);
    return {
      node: ft,
      internals: ft.internals,
      isParent: gt
    };
  }, kt);
  let B = _.type || "default", R = N?.[B] || Hv[B];
  R === void 0 && (U?.("003", Sn.error003(B)), B = "default", R = N?.default || Hv.default);
  const Z = !!(_.draggable || g && typeof _.draggable > "u"), J = !!(_.selectable || S && typeof _.selectable > "u"), it = !!(_.connectable || v && typeof _.connectable > "u"), tt = !!(_.focusable || y && typeof _.focusable > "u"), ot = $t(), lt = Zp(_), M = HN({ node: _, nodeType: B, hasDimensions: lt, resizeObserver: m }), V = x1({
    nodeRef: M,
    disabled: _.hidden || !Z,
    noDragClassName: p,
    handleSelector: _.dragHandle,
    nodeId: l,
    isSelectable: J,
    nodeClickDistance: w
  }), O = b1();
  if (_.hidden)
    return null;
  const H = bn(_), X = NN(_), K = J || Z || i || o || r || s, F = o ? (I) => o(I, { ...A.userNode }) : void 0, at = r ? (I) => r(I, { ...A.userNode }) : void 0, dt = s ? (I) => s(I, { ...A.userNode }) : void 0, pt = f ? (I) => f(I, { ...A.userNode }) : void 0, T = d ? (I) => d(I, { ...A.userNode }) : void 0, k = (I) => {
    const { selectNodesOnDrag: ft, nodeDragThreshold: gt } = ot.getState();
    J && (!ft || !Z || gt > 0) && Kd({
      id: l,
      store: ot,
      nodeRef: M
    }), i && i(I, { ...A.userNode });
  }, st = (I) => {
    if (!($p(I.nativeEvent) || E)) {
      if (Hp.includes(I.key) && J) {
        const ft = I.key === "Escape";
        Kd({
          id: l,
          store: ot,
          unselect: ft,
          nodeRef: M
        });
      } else if (Z && _.selected && Object.prototype.hasOwnProperty.call(sr, I.key)) {
        I.preventDefault();
        const { ariaLabelConfig: ft } = ot.getState();
        ot.setState({
          ariaLiveMessage: ft["node.a11yDescription.ariaLiveMessage"]({
            direction: I.key.replace("Arrow", "").toLowerCase(),
            x: ~~A.positionAbsolute.x,
            y: ~~A.positionAbsolute.y
          })
        }), O({
          direction: sr[I.key],
          factor: I.shiftKey ? 4 : 1
        });
      }
    }
  }, ut = () => {
    if (E || !M.current?.matches(":focus-visible"))
      return;
    const { transform: I, width: ft, height: gt, autoPanOnNodeFocus: ct, setCenter: rt } = ot.getState();
    if (!ct)
      return;
    uh(/* @__PURE__ */ new Map([[l, _]]), { x: 0, y: 0, width: ft, height: gt }, I, !0).length > 0 || rt(_.position.x + H.width / 2, _.position.y + H.height / 2, {
      zoom: I[2]
    });
  };
  return W.jsx("div", { className: ue([
    "react-flow__node",
    `react-flow__node-${B}`,
    {
      // this is overwritable by passing `nopan` as a class name
      [b]: Z
    },
    _.className,
    {
      selected: _.selected,
      selectable: J,
      parent: j,
      draggable: Z,
      dragging: V
    }
  ]), ref: M, style: {
    zIndex: A.z,
    transform: `translate(${A.positionAbsolute.x}px,${A.positionAbsolute.y}px)`,
    pointerEvents: K ? "all" : "none",
    visibility: lt ? "visible" : "hidden",
    ..._.style,
    ...X
  }, "data-id": l, "data-testid": `rf__node-${l}`, onMouseEnter: F, onMouseMove: at, onMouseLeave: dt, onContextMenu: pt, onClick: k, onDoubleClick: T, onKeyDown: tt ? st : void 0, tabIndex: tt ? 0 : void 0, onFocus: tt ? ut : void 0, role: _.ariaRole ?? (tt ? "group" : void 0), "aria-roledescription": "node", "aria-describedby": E ? void 0 : `${d1}-${C}`, "aria-label": _.ariaLabel, ..._.domAttributes, children: W.jsx(gN, { value: l, children: W.jsx(R, { id: l, data: _.data, type: B, positionAbsoluteX: A.positionAbsolute.x, positionAbsoluteY: A.positionAbsolute.y, selected: _.selected ?? !1, selectable: J, draggable: Z, deletable: _.deletable ?? !0, isConnectable: it, sourcePosition: _.sourcePosition, targetPosition: _.targetPosition, dragging: V, dragHandle: _.dragHandle, zIndex: A.z, parentId: _.parentId, ...H }) }) });
}
var BN = P.memo(UN);
const YN = (l) => ({
  nodesConnectable: l.nodesConnectable,
  nodesFocusable: l.nodesFocusable,
  elementsSelectable: l.elementsSelectable,
  onError: l.onError
});
function N1(l) {
  const { nodesConnectable: i, nodesFocusable: o, elementsSelectable: r, onError: s } = Bt(YN, kt), f = ON(l.onlyRenderVisibleElements), d = RN();
  return W.jsx("div", { className: "react-flow__nodes", style: _r, children: f.map((g) => (
    /*
     * The split of responsibilities between NodeRenderer and
     * NodeComponentWrapper may appear weird. However, it’s designed to
     * minimize the cost of updates when individual nodes change.
     *
     * For example, when you’re dragging a single node, that node gets
     * updated multiple times per second. If `NodeRenderer` were to update
     * every time, it would have to re-run the `nodes.map()` loop every
     * time. This gets pricey with hundreds of nodes, especially if every
     * loop cycle does more than just rendering a JSX element!
     *
     * As a result of this choice, we took the following implementation
     * decisions:
     * - NodeRenderer subscribes *only* to node IDs – and therefore
     *   rerender *only* when visible nodes are added or removed.
     * - NodeRenderer performs all operations the result of which can be
     *   shared between nodes (such as creating the `ResizeObserver`
     *   instance, or subscribing to `selector`). This means extra prop
     *   drilling into `NodeComponentWrapper`, but it means we need to run
     *   these operations only once – instead of once per node.
     * - Any operations that you’d normally write inside `nodes.map` are
     *   moved into `NodeComponentWrapper`. This ensures they are
     *   memorized – so if `NodeRenderer` *has* to rerender, it only
     *   needs to regenerate the list of nodes, nothing else.
     */
    W.jsx(BN, { id: g, nodeTypes: l.nodeTypes, nodeExtent: l.nodeExtent, onClick: l.onNodeClick, onMouseEnter: l.onNodeMouseEnter, onMouseMove: l.onNodeMouseMove, onMouseLeave: l.onNodeMouseLeave, onContextMenu: l.onNodeContextMenu, onDoubleClick: l.onNodeDoubleClick, noDragClassName: l.noDragClassName, noPanClassName: l.noPanClassName, rfId: l.rfId, disableKeyboardA11y: l.disableKeyboardA11y, resizeObserver: d, nodesDraggable: l.nodesDraggable ?? !0, nodesConnectable: i, nodesFocusable: o, elementsSelectable: r, nodeClickDistance: l.nodeClickDistance, onError: s }, g)
  )) });
}
N1.displayName = "NodeRenderer";
const VN = P.memo(N1);
function LN(l) {
  return Bt(P.useCallback((o) => {
    if (!l)
      return o.edges.map((s) => s.id);
    const r = [];
    if (o.width && o.height)
      for (const s of o.edges) {
        const f = o.nodeLookup.get(s.source), d = o.nodeLookup.get(s.target);
        f && d && Dw({
          sourceNode: f,
          targetNode: d,
          width: o.width,
          height: o.height,
          transform: o.transform
        }) && r.push(s.id);
      }
    return r;
  }, [l]), kt);
}
const qN = ({ color: l = "none", strokeWidth: i = 1 }) => {
  const o = {
    strokeWidth: i,
    ...l && { stroke: l }
  };
  return W.jsx("polyline", { className: "arrow", style: o, strokeLinecap: "round", fill: "none", strokeLinejoin: "round", points: "-5,-4 0,0 -5,4" });
}, XN = ({ color: l = "none", strokeWidth: i = 1 }) => {
  const o = {
    strokeWidth: i,
    ...l && { stroke: l, fill: l }
  };
  return W.jsx("polyline", { className: "arrowclosed", style: o, strokeLinecap: "round", strokeLinejoin: "round", points: "-5,-4 0,0 -5,4 -5,-4" });
}, Bv = {
  [ur.Arrow]: qN,
  [ur.ArrowClosed]: XN
};
function jN(l) {
  const i = $t();
  return P.useMemo(() => Object.prototype.hasOwnProperty.call(Bv, l) ? Bv[l] : (i.getState().onError?.("009", Sn.error009(l)), null), [l]);
}
const ZN = ({ id: l, type: i, color: o, width: r = 12.5, height: s = 12.5, markerUnits: f = "strokeWidth", strokeWidth: d, orient: g = "auto-start-reverse" }) => {
  const S = jN(i);
  return S ? W.jsx("marker", { className: "react-flow__arrowhead", id: l, markerWidth: `${r}`, markerHeight: `${s}`, viewBox: "-10 -10 20 20", markerUnits: f, orient: g, refX: "0", refY: "0", children: W.jsx(S, { color: o, strokeWidth: d }) }) : null;
}, T1 = ({ defaultColor: l, rfId: i }) => {
  const o = Bt((f) => f.edges), r = Bt((f) => f.defaultEdgeOptions), s = P.useMemo(() => Xw(o, {
    id: i,
    defaultColor: l,
    defaultMarkerStart: r?.markerStart,
    defaultMarkerEnd: r?.markerEnd
  }), [o, r, i, l]);
  return s.length ? W.jsx("svg", { className: "react-flow__marker", "aria-hidden": "true", children: W.jsx("defs", { children: s.map((f) => W.jsx(ZN, { id: f.id, type: f.type, color: f.color, width: f.width, height: f.height, markerUnits: f.markerUnits, strokeWidth: f.strokeWidth, orient: f.orient }, f.id)) }) }) : null;
};
T1.displayName = "MarkerDefinitions";
var GN = P.memo(T1);
function M1({ x: l, y: i, label: o, labelStyle: r, labelShowBg: s = !0, labelBgStyle: f, labelBgPadding: d = [2, 4], labelBgBorderRadius: g = 2, children: S, className: v, ...y }) {
  const [m, p] = P.useState({ x: 1, y: 0, width: 0, height: 0 }), b = ue(["react-flow__edge-textwrapper", v]), E = P.useRef(null);
  return P.useEffect(() => {
    if (E.current) {
      const C = E.current.getBBox();
      p({
        x: C.x,
        y: C.y,
        width: C.width,
        height: C.height
      });
    }
  }, [o]), o ? W.jsxs("g", { transform: `translate(${l - m.width / 2} ${i - m.height / 2})`, className: b, visibility: m.width ? "visible" : "hidden", ...y, children: [s && W.jsx("rect", { width: m.width + 2 * d[0], x: -d[0], y: -d[1], height: m.height + 2 * d[1], className: "react-flow__edge-textbg", style: f, rx: g, ry: g }), W.jsx("text", { className: "react-flow__edge-text", y: m.height / 2, dy: "0.3em", ref: E, style: r, children: o }), S] }) : null;
}
M1.displayName = "EdgeText";
const QN = P.memo(M1);
function wr({ path: l, labelX: i, labelY: o, label: r, labelStyle: s, labelShowBg: f, labelBgStyle: d, labelBgPadding: g, labelBgBorderRadius: S, interactionWidth: v = 20, ...y }) {
  return W.jsxs(W.Fragment, { children: [W.jsx("path", { ...y, d: l, fill: "none", className: ue(["react-flow__edge-path", y.className]) }), v ? W.jsx("path", { d: l, fill: "none", strokeOpacity: 0, strokeWidth: v, className: "react-flow__edge-interaction" }) : null, r && vn(i) && vn(o) ? W.jsx(QN, { x: i, y: o, label: r, labelStyle: s, labelShowBg: f, labelBgStyle: d, labelBgPadding: g, labelBgBorderRadius: S }) : null] });
}
function Yv({ pos: l, x1: i, y1: o, x2: r, y2: s }) {
  return l === xt.Left || l === xt.Right ? [0.5 * (i + r), o] : [i, 0.5 * (o + s)];
}
function z1({ sourceX: l, sourceY: i, sourcePosition: o = xt.Bottom, targetX: r, targetY: s, targetPosition: f = xt.Top }) {
  const [d, g] = Yv({
    pos: o,
    x1: l,
    y1: i,
    x2: r,
    y2: s
  }), [S, v] = Yv({
    pos: f,
    x1: r,
    y1: s,
    x2: l,
    y2: i
  }), [y, m, p, b] = Ip({
    sourceX: l,
    sourceY: i,
    targetX: r,
    targetY: s,
    sourceControlX: d,
    sourceControlY: g,
    targetControlX: S,
    targetControlY: v
  });
  return [
    `M${l},${i} C${d},${g} ${S},${v} ${r},${s}`,
    y,
    m,
    p,
    b
  ];
}
function C1(l) {
  return P.memo(({ id: i, sourceX: o, sourceY: r, targetX: s, targetY: f, sourcePosition: d, targetPosition: g, label: S, labelStyle: v, labelShowBg: y, labelBgStyle: m, labelBgPadding: p, labelBgBorderRadius: b, style: E, markerEnd: C, markerStart: N, interactionWidth: w }) => {
    const [U, _, A] = z1({
      sourceX: o,
      sourceY: r,
      sourcePosition: d,
      targetX: s,
      targetY: f,
      targetPosition: g
    }), j = l.isInternal ? void 0 : i;
    return W.jsx(wr, { id: j, path: U, labelX: _, labelY: A, label: S, labelStyle: v, labelShowBg: y, labelBgStyle: m, labelBgPadding: p, labelBgBorderRadius: b, style: E, markerEnd: C, markerStart: N, interactionWidth: w });
  });
}
const KN = C1({ isInternal: !1 }), A1 = C1({ isInternal: !0 });
KN.displayName = "SimpleBezierEdge";
A1.displayName = "SimpleBezierEdgeInternal";
function O1(l) {
  return P.memo(({ id: i, sourceX: o, sourceY: r, targetX: s, targetY: f, label: d, labelStyle: g, labelShowBg: S, labelBgStyle: v, labelBgPadding: y, labelBgBorderRadius: m, style: p, sourcePosition: b = xt.Bottom, targetPosition: E = xt.Top, markerEnd: C, markerStart: N, pathOptions: w, interactionWidth: U }) => {
    const [_, A, j] = jd({
      sourceX: o,
      sourceY: r,
      sourcePosition: b,
      targetX: s,
      targetY: f,
      targetPosition: E,
      borderRadius: w?.borderRadius,
      offset: w?.offset,
      stepPosition: w?.stepPosition
    }), B = l.isInternal ? void 0 : i;
    return W.jsx(wr, { id: B, path: _, labelX: A, labelY: j, label: d, labelStyle: g, labelShowBg: S, labelBgStyle: v, labelBgPadding: y, labelBgBorderRadius: m, style: p, markerEnd: C, markerStart: N, interactionWidth: U });
  });
}
const D1 = O1({ isInternal: !1 }), R1 = O1({ isInternal: !0 });
D1.displayName = "SmoothStepEdge";
R1.displayName = "SmoothStepEdgeInternal";
function H1(l) {
  return P.memo(({ id: i, ...o }) => {
    const r = l.isInternal ? void 0 : i;
    return W.jsx(D1, { ...o, id: r, pathOptions: P.useMemo(() => ({ borderRadius: 0, offset: o.pathOptions?.offset }), [o.pathOptions?.offset]) });
  });
}
const $N = H1({ isInternal: !1 }), U1 = H1({ isInternal: !0 });
$N.displayName = "StepEdge";
U1.displayName = "StepEdgeInternal";
function B1(l) {
  return P.memo(({ id: i, sourceX: o, sourceY: r, targetX: s, targetY: f, label: d, labelStyle: g, labelShowBg: S, labelBgStyle: v, labelBgPadding: y, labelBgBorderRadius: m, style: p, markerEnd: b, markerStart: E, interactionWidth: C }) => {
    const [N, w, U] = Wp({ sourceX: o, sourceY: r, targetX: s, targetY: f }), _ = l.isInternal ? void 0 : i;
    return W.jsx(wr, { id: _, path: N, labelX: w, labelY: U, label: d, labelStyle: g, labelShowBg: S, labelBgStyle: v, labelBgPadding: y, labelBgBorderRadius: m, style: p, markerEnd: b, markerStart: E, interactionWidth: C });
  });
}
const JN = B1({ isInternal: !1 }), Y1 = B1({ isInternal: !0 });
JN.displayName = "StraightEdge";
Y1.displayName = "StraightEdgeInternal";
function V1(l) {
  return P.memo(({ id: i, sourceX: o, sourceY: r, targetX: s, targetY: f, sourcePosition: d = xt.Bottom, targetPosition: g = xt.Top, label: S, labelStyle: v, labelShowBg: y, labelBgStyle: m, labelBgPadding: p, labelBgBorderRadius: b, style: E, markerEnd: C, markerStart: N, pathOptions: w, interactionWidth: U }) => {
    const [_, A, j] = kp({
      sourceX: o,
      sourceY: r,
      sourcePosition: d,
      targetX: s,
      targetY: f,
      targetPosition: g,
      curvature: w?.curvature
    }), B = l.isInternal ? void 0 : i;
    return W.jsx(wr, { id: B, path: _, labelX: A, labelY: j, label: S, labelStyle: v, labelShowBg: y, labelBgStyle: m, labelBgPadding: p, labelBgBorderRadius: b, style: E, markerEnd: C, markerStart: N, interactionWidth: U });
  });
}
const IN = V1({ isInternal: !1 }), L1 = V1({ isInternal: !0 });
IN.displayName = "BezierEdge";
L1.displayName = "BezierEdgeInternal";
const Vv = {
  default: L1,
  straight: Y1,
  step: U1,
  smoothstep: R1,
  simplebezier: A1
}, Lv = {
  sourceX: null,
  sourceY: null,
  targetX: null,
  targetY: null,
  sourcePosition: null,
  targetPosition: null,
  zIndex: void 0
}, kN = (l, i, o) => o === xt.Left ? l - i : o === xt.Right ? l + i : l, FN = (l, i, o) => o === xt.Top ? l - i : o === xt.Bottom ? l + i : l, qv = "react-flow__edgeupdater";
function Xv({ position: l, centerX: i, centerY: o, radius: r = 10, onMouseDown: s, onMouseEnter: f, onMouseOut: d, type: g }) {
  return W.jsx("circle", { onMouseDown: s, onMouseEnter: f, onMouseOut: d, className: ue([qv, `${qv}-${g}`]), cx: kN(i, r, l), cy: FN(o, r, l), r, stroke: "transparent", fill: "transparent" });
}
function WN({ isReconnectable: l, reconnectRadius: i, edge: o, sourceX: r, sourceY: s, targetX: f, targetY: d, sourcePosition: g, targetPosition: S, onReconnect: v, onReconnectStart: y, onReconnectEnd: m, setReconnecting: p, setUpdateHover: b }) {
  const E = $t(), C = (A, j) => {
    if (A.button !== 0)
      return;
    const { autoPanOnConnect: B, domNode: R, connectionMode: Z, connectionRadius: J, lib: it, onConnectStart: tt, cancelConnection: ot, nodeLookup: lt, rfId: M, panBy: V, updateConnection: O } = E.getState(), H = j.type === "target", X = (at, dt) => {
      p(!1), m?.(at, o, j.type, dt);
    }, K = (at) => v?.(o, at), F = (at, dt) => {
      p(!0), y?.(A, o, j.type), tt?.(at, dt);
    };
    Qd.onPointerDown(A.nativeEvent, {
      autoPanOnConnect: B,
      connectionMode: Z,
      connectionRadius: J,
      domNode: R,
      handleId: j.id,
      nodeId: j.nodeId,
      nodeLookup: lt,
      isTarget: H,
      edgeUpdaterType: j.type,
      lib: it,
      flowId: M,
      cancelConnection: ot,
      panBy: V,
      isValidConnection: (...at) => E.getState().isValidConnection?.(...at) ?? !0,
      onConnect: K,
      onConnectStart: F,
      onConnectEnd: (...at) => E.getState().onConnectEnd?.(...at),
      onReconnectEnd: X,
      updateConnection: O,
      getTransform: () => E.getState().transform,
      getFromHandle: () => E.getState().connection.fromHandle,
      dragThreshold: E.getState().connectionDragThreshold,
      handleDomNode: A.currentTarget
    });
  }, N = (A) => C(A, { nodeId: o.target, id: o.targetHandle ?? null, type: "target" }), w = (A) => C(A, { nodeId: o.source, id: o.sourceHandle ?? null, type: "source" }), U = () => b(!0), _ = () => b(!1);
  return W.jsxs(W.Fragment, { children: [(l === !0 || l === "source") && W.jsx(Xv, { position: g, centerX: r, centerY: s, radius: i, onMouseDown: N, onMouseEnter: U, onMouseOut: _, type: "source" }), (l === !0 || l === "target") && W.jsx(Xv, { position: S, centerX: f, centerY: d, radius: i, onMouseDown: w, onMouseEnter: U, onMouseOut: _, type: "target" })] });
}
function PN({ id: l, edgesFocusable: i, edgesReconnectable: o, elementsSelectable: r, onClick: s, onDoubleClick: f, onContextMenu: d, onMouseEnter: g, onMouseMove: S, onMouseLeave: v, reconnectRadius: y, onReconnect: m, onReconnectStart: p, onReconnectEnd: b, rfId: E, edgeTypes: C, noPanClassName: N, onError: w, disableKeyboardA11y: U }) {
  let _ = Bt((rt) => rt.edgeLookup.get(l));
  const A = Bt((rt) => rt.defaultEdgeOptions);
  _ = A ? { ...A, ..._ } : _;
  let j = _.type || "default", B = C?.[j] || Vv[j];
  B === void 0 && (w?.("011", Sn.error011(j)), j = "default", B = C?.default || Vv.default);
  const R = !!(_.focusable || i && typeof _.focusable > "u"), Z = typeof m < "u" && (_.reconnectable || o && typeof _.reconnectable > "u"), J = !!(_.selectable || r && typeof _.selectable > "u"), it = P.useRef(null), [tt, ot] = P.useState(!1), [lt, M] = P.useState(!1), V = $t(), { zIndex: O = _.zIndex, sourceX: H, sourceY: X, targetX: K, targetY: F, sourcePosition: at, targetPosition: dt } = Bt(P.useCallback((rt) => {
    const vt = rt.nodeLookup.get(_.source), wt = rt.nodeLookup.get(_.target);
    if (!vt || !wt)
      return Lv;
    const _t = qw({
      id: l,
      sourceNode: vt,
      targetNode: wt,
      sourceHandle: _.sourceHandle || null,
      targetHandle: _.targetHandle || null,
      connectionMode: rt.connectionMode,
      onError: w
    }), Mt = Ow({
      selected: _.selected,
      zIndex: _.zIndex,
      sourceNode: vt,
      targetNode: wt,
      elevateOnSelect: rt.elevateEdgesOnSelect,
      zIndexMode: rt.zIndexMode
    });
    return {
      ..._t || Lv,
      zIndex: Mt
    };
  }, [_.source, _.target, _.sourceHandle, _.targetHandle, _.selected, _.zIndex, w]), kt), pt = P.useMemo(() => _.markerStart ? `url('#${Zd(_.markerStart, E)}')` : void 0, [_.markerStart, E]), T = P.useMemo(() => _.markerEnd ? `url('#${Zd(_.markerEnd, E)}')` : void 0, [_.markerEnd, E]);
  if (_.hidden || H === null || X === null || K === null || F === null)
    return null;
  const k = (rt) => {
    const { addSelectedEdges: vt, unselectNodesAndEdges: wt, multiSelectionActive: _t } = V.getState();
    J && (V.setState({ nodesSelectionActive: !1 }), _.selected && _t ? (wt({ nodes: [], edges: [_] }), it.current?.blur()) : vt([l])), s && s(rt, _);
  }, st = f ? (rt) => {
    f(rt, { ..._ });
  } : void 0, ut = d ? (rt) => {
    d(rt, { ..._ });
  } : void 0, I = g ? (rt) => {
    g(rt, { ..._ });
  } : void 0, ft = S ? (rt) => {
    S(rt, { ..._ });
  } : void 0, gt = v ? (rt) => {
    v(rt, { ..._ });
  } : void 0, ct = (rt) => {
    if (!U && Hp.includes(rt.key) && J) {
      const { unselectNodesAndEdges: vt, addSelectedEdges: wt } = V.getState();
      rt.key === "Escape" ? (it.current?.blur(), vt({ edges: [_] })) : wt([l]);
    }
  };
  return W.jsx("svg", { style: { zIndex: O }, children: W.jsxs("g", { className: ue([
    "react-flow__edge",
    `react-flow__edge-${j}`,
    _.className,
    N,
    {
      selected: _.selected,
      animated: _.animated,
      inactive: !J && !s,
      updating: tt,
      selectable: J
    }
  ]), onClick: k, onDoubleClick: st, onContextMenu: ut, onMouseEnter: I, onMouseMove: ft, onMouseLeave: gt, onKeyDown: R ? ct : void 0, tabIndex: R ? 0 : void 0, role: _.ariaRole ?? (R ? "group" : "img"), "aria-roledescription": "edge", "data-id": l, "data-testid": `rf__edge-${l}`, "aria-label": _.ariaLabel === null ? void 0 : _.ariaLabel || `Edge from ${_.source} to ${_.target}`, "aria-describedby": R ? `${h1}-${E}` : void 0, ref: it, ..._.domAttributes, children: [!lt && W.jsx(B, { id: l, source: _.source, target: _.target, type: _.type, selected: _.selected, animated: _.animated, selectable: J, deletable: _.deletable ?? !0, label: _.label, labelStyle: _.labelStyle, labelShowBg: _.labelShowBg, labelBgStyle: _.labelBgStyle, labelBgPadding: _.labelBgPadding, labelBgBorderRadius: _.labelBgBorderRadius, sourceX: H, sourceY: X, targetX: K, targetY: F, sourcePosition: at, targetPosition: dt, data: _.data, style: _.style, sourceHandleId: _.sourceHandle, targetHandleId: _.targetHandle, markerStart: pt, markerEnd: T, pathOptions: "pathOptions" in _ ? _.pathOptions : void 0, interactionWidth: _.interactionWidth }), Z && W.jsx(WN, { edge: _, isReconnectable: Z, reconnectRadius: y, onReconnect: m, onReconnectStart: p, onReconnectEnd: b, sourceX: H, sourceY: X, targetX: K, targetY: F, sourcePosition: at, targetPosition: dt, setUpdateHover: ot, setReconnecting: M })] }) });
}
var tT = P.memo(PN);
const eT = (l) => ({
  edgesFocusable: l.edgesFocusable,
  edgesReconnectable: l.edgesReconnectable,
  elementsSelectable: l.elementsSelectable,
  connectionMode: l.connectionMode,
  onError: l.onError
});
function q1({ defaultMarkerColor: l, onlyRenderVisibleElements: i, rfId: o, edgeTypes: r, noPanClassName: s, onReconnect: f, onEdgeContextMenu: d, onEdgeMouseEnter: g, onEdgeMouseMove: S, onEdgeMouseLeave: v, onEdgeClick: y, reconnectRadius: m, onEdgeDoubleClick: p, onReconnectStart: b, onReconnectEnd: E, disableKeyboardA11y: C }) {
  const { edgesFocusable: N, edgesReconnectable: w, elementsSelectable: U, onError: _ } = Bt(eT, kt), A = LN(i);
  return W.jsxs("div", { className: "react-flow__edges", children: [W.jsx(GN, { defaultColor: l, rfId: o }), A.map((j) => W.jsx(tT, { id: j, edgesFocusable: N, edgesReconnectable: w, elementsSelectable: U, noPanClassName: s, onReconnect: f, onContextMenu: d, onMouseEnter: g, onMouseMove: S, onMouseLeave: v, onClick: y, reconnectRadius: m, onDoubleClick: p, onReconnectStart: b, onReconnectEnd: E, rfId: o, onError: _, edgeTypes: r, disableKeyboardA11y: C }, j))] });
}
q1.displayName = "EdgeRenderer";
const nT = P.memo(q1), jv = (l) => `translate(${l[0]}px,${l[1]}px) scale(${l[2]})`;
function lT({ children: l }) {
  const i = $t(), o = P.useRef(null), [r] = P.useState(() => i.getState().transform);
  return p1(() => {
    let s = null;
    const f = () => {
      const d = i.getState().transform;
      s && d[0] === s[0] && d[1] === s[1] && d[2] === s[2] || (s = d, o.current && (o.current.style.transform = jv(d)));
    };
    return f(), i.subscribe(f);
  }, [i]), W.jsx("div", { ref: o, className: "react-flow__viewport xyflow__viewport react-flow__container", style: { transform: jv(r) }, children: l });
}
function aT(l) {
  const i = mh(), o = P.useRef(!1);
  P.useEffect(() => {
    !o.current && i.viewportInitialized && l && (setTimeout(() => l(i), 1), o.current = !0);
  }, [l, i.viewportInitialized]);
}
const iT = (l) => l.panZoom?.syncViewport;
function uT(l) {
  const i = Bt(iT), o = $t();
  return P.useEffect(() => {
    l && (i?.(l), o.setState({ transform: [l.x, l.y, l.zoom] }));
  }, [l, i]), null;
}
function oT(l) {
  return l.connection.inProgress ? { ...l.connection, to: eo(l.connection.to, l.transform) } : { ...l.connection };
}
function cT(l) {
  return oT;
}
function rT(l) {
  const i = cT();
  return Bt(i, kt);
}
const sT = (l) => ({
  nodesConnectable: l.nodesConnectable,
  isValid: l.connection.isValid,
  inProgress: l.connection.inProgress,
  width: l.width,
  height: l.height
});
function fT({ containerStyle: l, style: i, type: o, component: r }) {
  const { nodesConnectable: s, width: f, height: d, isValid: g, inProgress: S } = Bt(sT, kt);
  return !(f && s && S) ? null : W.jsx("svg", { style: l, width: f, height: d, className: "react-flow__connectionline react-flow__container", children: W.jsx("g", { className: ue(["react-flow__connection", Qp(g)]), children: W.jsx(X1, { style: i, type: o, CustomComponent: r, isValid: g }) }) });
}
const X1 = ({ style: l, type: i = Ll.Bezier, CustomComponent: o, isValid: r }) => {
  const { inProgress: s, from: f, fromNode: d, fromHandle: g, fromPosition: S, to: v, toNode: y, toHandle: m, toPosition: p, pointer: b } = rT();
  if (!s)
    return;
  if (o)
    return W.jsx(o, { connectionLineType: i, connectionLineStyle: l, fromNode: d, fromHandle: g, fromX: f.x, fromY: f.y, toX: v.x, toY: v.y, fromPosition: S, toPosition: p, connectionStatus: Qp(r), toNode: y, toHandle: m, pointer: b });
  let E = "";
  const C = {
    sourceX: f.x,
    sourceY: f.y,
    sourcePosition: S,
    targetX: v.x,
    targetY: v.y,
    targetPosition: p
  };
  switch (i) {
    case Ll.Bezier:
      [E] = kp(C);
      break;
    case Ll.SimpleBezier:
      [E] = z1(C);
      break;
    case Ll.Step:
      [E] = jd({
        ...C,
        borderRadius: 0
      });
      break;
    case Ll.SmoothStep:
      [E] = jd(C);
      break;
    default:
      [E] = Wp(C);
  }
  return W.jsx("path", { d: E, fill: "none", className: "react-flow__connection-path", style: l });
};
X1.displayName = "ConnectionLine";
const dT = {};
function Zv(l = dT) {
  P.useRef(l), $t(), P.useEffect(() => {
  }, [l]);
}
function hT() {
  $t(), P.useRef(!1), P.useEffect(() => {
  }, []);
}
function j1({ nodeTypes: l, edgeTypes: i, onInit: o, onNodeClick: r, onEdgeClick: s, onNodeDoubleClick: f, onEdgeDoubleClick: d, onNodeMouseEnter: g, onNodeMouseMove: S, onNodeMouseLeave: v, onNodeContextMenu: y, onSelectionContextMenu: m, onSelectionStart: p, onSelectionEnd: b, connectionLineType: E, connectionLineStyle: C, connectionLineComponent: N, connectionLineContainerStyle: w, selectionKeyCode: U, selectionOnDrag: _, selectionMode: A, multiSelectionKeyCode: j, panActivationKeyCode: B, zoomActivationKeyCode: R, deleteKeyCode: Z, onlyRenderVisibleElements: J, elementsSelectable: it, defaultViewport: tt, translateExtent: ot, minZoom: lt, maxZoom: M, preventScrolling: V, defaultMarkerColor: O, zoomOnScroll: H, zoomOnPinch: X, panOnScroll: K, panOnScrollSpeed: F, panOnScrollMode: at, zoomOnDoubleClick: dt, panOnDrag: pt, autoPanOnSelection: T, onPaneClick: k, onPaneMouseEnter: st, onPaneMouseMove: ut, onPaneMouseLeave: I, onPaneScroll: ft, onPaneContextMenu: gt, paneClickDistance: ct, nodeClickDistance: rt, onEdgeContextMenu: vt, onEdgeMouseEnter: wt, onEdgeMouseMove: _t, onEdgeMouseLeave: Mt, reconnectRadius: Ht, onReconnect: Ot, onReconnectStart: Pt, onReconnectEnd: xe, noDragClassName: re, noWheelClassName: En, noPanClassName: Ie, disableKeyboardA11y: Oe, nodeExtent: _e, rfId: De, viewport: Ve, onViewportChange: _n, nodesDraggable: ke }) {
  return Zv(l), Zv(i), hT(), aT(o), uT(Ve), W.jsx(CN, { onPaneClick: k, onPaneMouseEnter: st, onPaneMouseMove: ut, onPaneMouseLeave: I, onPaneContextMenu: gt, onPaneScroll: ft, paneClickDistance: ct, deleteKeyCode: Z, selectionKeyCode: U, selectionOnDrag: _, selectionMode: A, onSelectionStart: p, onSelectionEnd: b, multiSelectionKeyCode: j, panActivationKeyCode: B, zoomActivationKeyCode: R, elementsSelectable: it, zoomOnScroll: H, zoomOnPinch: X, zoomOnDoubleClick: dt, panOnScroll: K, panOnScrollSpeed: F, panOnScrollMode: at, panOnDrag: pt, autoPanOnSelection: T, defaultViewport: tt, translateExtent: ot, minZoom: lt, maxZoom: M, onSelectionContextMenu: m, preventScrolling: V, noDragClassName: re, noWheelClassName: En, noPanClassName: Ie, disableKeyboardA11y: Oe, onViewportChange: _n, isControlledViewport: !!Ve, children: W.jsxs(lT, { children: [W.jsx(nT, { edgeTypes: i, onEdgeClick: s, onEdgeDoubleClick: d, onReconnect: Ot, onReconnectStart: Pt, onReconnectEnd: xe, onlyRenderVisibleElements: J, onEdgeContextMenu: vt, onEdgeMouseEnter: wt, onEdgeMouseMove: _t, onEdgeMouseLeave: Mt, reconnectRadius: Ht, defaultMarkerColor: O, noPanClassName: Ie, disableKeyboardA11y: Oe, rfId: De }), W.jsx(fT, { style: C, type: E, component: N, containerStyle: w }), W.jsx("div", { className: "react-flow__edgelabel-renderer" }), W.jsx(VN, { nodeTypes: l, onNodeClick: r, onNodeDoubleClick: f, onNodeMouseEnter: g, onNodeMouseMove: S, onNodeMouseLeave: v, onNodeContextMenu: y, nodeClickDistance: rt, onlyRenderVisibleElements: J, noPanClassName: Ie, noDragClassName: re, disableKeyboardA11y: Oe, nodeExtent: _e, rfId: De, nodesDraggable: ke }), W.jsx("div", { className: "react-flow__viewport-portal" })] }) });
}
j1.displayName = "GraphView";
const gT = P.memo(j1), mT = jp(), Gv = ({ nodes: l, edges: i, defaultNodes: o, defaultEdges: r, width: s, height: f, fitView: d, fitViewOptions: g, minZoom: S = 0.5, maxZoom: v = 2, nodeOrigin: y, nodeExtent: m, zIndexMode: p = "basic" } = {}) => {
  const b = /* @__PURE__ */ new Map(), E = /* @__PURE__ */ new Map(), C = /* @__PURE__ */ new Map(), N = /* @__PURE__ */ new Map(), w = r ?? i ?? [], U = o ?? l ?? [], _ = y ?? [0, 0], A = m ?? Gu;
  e1(C, N, w);
  const { nodesInitialized: j } = Gd(U, b, E, {
    nodeOrigin: _,
    nodeExtent: A,
    zIndexMode: p
  });
  let B = [0, 0, 1];
  if (d && s && f) {
    const R = Pu(b, {
      filter: (tt) => !!((tt.width || tt.initialWidth) && (tt.height || tt.initialHeight))
    }), { x: Z, y: J, zoom: it } = ch(R, s, f, S, v, g?.padding ?? 0.1);
    B = [Z, J, it];
  }
  return {
    rfId: "1",
    width: s ?? 0,
    height: f ?? 0,
    transform: B,
    nodes: U,
    nodesInitialized: j,
    nodeLookup: b,
    parentLookup: E,
    edges: w,
    edgeLookup: N,
    connectionLookup: C,
    onNodesChange: null,
    onEdgesChange: null,
    hasDefaultNodes: o !== void 0,
    hasDefaultEdges: r !== void 0,
    panZoom: null,
    minZoom: S,
    maxZoom: v,
    translateExtent: Gu,
    nodeExtent: A,
    nodesSelectionActive: !1,
    userSelectionActive: !1,
    userSelectionRect: null,
    connectionMode: Ci.Strict,
    domNode: null,
    paneDragging: !1,
    noPanClassName: "nopan",
    nodeOrigin: _,
    nodeDragThreshold: 1,
    connectionDragThreshold: 1,
    snapGrid: [15, 15],
    snapToGrid: !1,
    nodesDraggable: !0,
    nodesConnectable: !0,
    nodesFocusable: !0,
    edgesFocusable: !0,
    edgesReconnectable: !0,
    elementsSelectable: !0,
    elevateNodesOnSelect: !0,
    elevateEdgesOnSelect: !0,
    selectNodesOnDrag: !0,
    multiSelectionActive: !1,
    fitViewQueued: d ?? !1,
    fitViewOptions: g,
    fitViewResolver: null,
    connection: { ...Bp },
    connectionClickStartHandle: null,
    connectOnClick: !0,
    ariaLiveMessage: "",
    autoPanOnConnect: !0,
    autoPanOnNodeDrag: !0,
    autoPanOnNodeFocus: !0,
    autoPanSpeed: 15,
    connectionRadius: 20,
    onError: mT,
    isValidConnection: void 0,
    onSelectionChangeHandlers: [],
    lib: "react",
    debug: !1,
    ariaLabelConfig: Up,
    zIndexMode: p,
    defaultEdgeOptions: void 0,
    onNodesChangeMiddlewareMap: /* @__PURE__ */ new Map(),
    onEdgesChangeMiddlewareMap: /* @__PURE__ */ new Map(),
    onNodesDelete: void 0,
    onEdgesDelete: void 0,
    onDelete: void 0,
    onBeforeDelete: void 0,
    onViewportChangeStart: void 0,
    onViewportChange: void 0,
    onViewportChangeEnd: void 0,
    onNodeDragStart: void 0,
    onNodeDrag: void 0,
    onNodeDragStop: void 0,
    onSelectionDragStart: void 0,
    onSelectionDrag: void 0,
    onSelectionDragStop: void 0,
    onMoveStart: void 0,
    onMove: void 0,
    onMoveEnd: void 0,
    onConnect: void 0,
    onConnectStart: void 0,
    onConnectEnd: void 0,
    onClickConnectStart: void 0,
    onClickConnectEnd: void 0
  };
}, yT = ({ nodes: l, edges: i, defaultNodes: o, defaultEdges: r, width: s, height: f, fitView: d, fitViewOptions: g, minZoom: S, maxZoom: v, nodeOrigin: y, nodeExtent: m, zIndexMode: p }) => C3((b, E) => {
  async function C() {
    const { nodeLookup: N, panZoom: w, fitViewOptions: U, fitViewResolver: _, width: A, height: j, minZoom: B, maxZoom: R } = E();
    w && (await ww({
      nodes: N,
      width: A,
      height: j,
      panZoom: w,
      minZoom: B,
      maxZoom: R
    }, U), _?.resolve(!0), b({ fitViewResolver: null }));
  }
  return {
    ...Gv({
      nodes: l,
      edges: i,
      width: s,
      height: f,
      fitView: d,
      fitViewOptions: g,
      minZoom: S,
      maxZoom: v,
      nodeOrigin: y,
      nodeExtent: m,
      defaultNodes: o,
      defaultEdges: r,
      zIndexMode: p
    }),
    setNodes: (N) => {
      const { nodeLookup: w, parentLookup: U, nodeOrigin: _, nodeExtent: A, elevateNodesOnSelect: j, fitViewQueued: B, zIndexMode: R, nodesSelectionActive: Z } = E(), { nodesInitialized: J, hasSelectedNodes: it } = Gd(N, w, U, {
        nodeOrigin: _,
        nodeExtent: A,
        elevateNodesOnSelect: j,
        checkEquality: !0,
        zIndexMode: R
      }), tt = Z && it;
      B && J ? (C(), b({
        nodes: N,
        nodesInitialized: J,
        fitViewQueued: !1,
        fitViewOptions: void 0,
        nodesSelectionActive: tt
      })) : b({ nodes: N, nodesInitialized: J, nodesSelectionActive: tt });
    },
    setEdges: (N) => {
      const { connectionLookup: w, edgeLookup: U } = E();
      e1(w, U, N), b({ edges: N });
    },
    setDefaultNodesAndEdges: (N, w) => {
      if (N) {
        const { setNodes: U } = E();
        U(N), b({ hasDefaultNodes: !0 });
      }
      if (w) {
        const { setEdges: U } = E();
        U(w), b({ hasDefaultEdges: !0 });
      }
    },
    /*
     * Every node gets registered at a ResizeObserver. Whenever a node
     * changes its dimensions, this function is called to measure the
     * new dimensions and update the nodes.
     */
    updateNodeInternals: (N) => {
      const { triggerNodeChanges: w, nodeLookup: U, parentLookup: _, domNode: A, nodeOrigin: j, nodeExtent: B, debug: R, fitViewQueued: Z, zIndexMode: J } = E(), { changes: it, updatedInternals: tt } = Jw(N, U, _, A, j, B, J);
      tt && (Gw(U, _, { nodeOrigin: j, nodeExtent: B, zIndexMode: J }), Z ? (C(), b({ fitViewQueued: !1, fitViewOptions: void 0 })) : b({}), it?.length > 0 && (R && console.log("React Flow: trigger node changes", it), w?.(it)));
    },
    updateNodePositions: (N, w = !1) => {
      const U = [];
      let _ = [];
      const { nodeLookup: A, triggerNodeChanges: j, connection: B, updateConnection: R, onNodesChangeMiddlewareMap: Z } = E();
      for (const [J, it] of N) {
        const tt = A.get(J), ot = !!(tt?.expandParent && tt?.parentId && it?.position), lt = {
          id: J,
          type: "position",
          position: ot ? {
            x: Math.max(0, it.position.x),
            y: Math.max(0, it.position.y)
          } : it.position,
          dragging: w
        };
        if (tt && B.inProgress && B.fromNode.id === tt.id) {
          const M = wa(tt, B.fromHandle, xt.Left, !0);
          R({ ...B, from: M });
        }
        ot && tt.parentId && U.push({
          id: J,
          parentId: tt.parentId,
          rect: {
            ...it.internals.positionAbsolute,
            width: it.measured.width ?? 0,
            height: it.measured.height ?? 0
          }
        }), _.push(lt);
      }
      if (U.length > 0) {
        const { parentLookup: J, nodeOrigin: it } = E(), tt = gh(U, A, J, it);
        _.push(...tt);
      }
      for (const J of Z.values())
        _ = J(_);
      j(_);
    },
    triggerNodeChanges: (N) => {
      const { onNodesChange: w, setNodes: U, nodes: _, hasDefaultNodes: A, debug: j } = E();
      if (N?.length) {
        if (A) {
          const B = y1(N, _);
          U(B);
        }
        j && console.log("React Flow: trigger node changes", N), w?.(N);
      }
    },
    triggerEdgeChanges: (N) => {
      const { onEdgesChange: w, setEdges: U, edges: _, hasDefaultEdges: A, debug: j } = E();
      if (N?.length) {
        if (A) {
          const B = k3(N, _);
          U(B);
        }
        j && console.log("React Flow: trigger edge changes", N), w?.(N);
      }
    },
    addSelectedNodes: (N) => {
      const { multiSelectionActive: w, edgeLookup: U, nodeLookup: _, triggerNodeChanges: A, triggerEdgeChanges: j } = E();
      if (w) {
        const B = N.map((R) => ga(R, !0));
        A(B);
        return;
      }
      A(xi(_, /* @__PURE__ */ new Set([...N]))), j(xi(U));
    },
    addSelectedEdges: (N) => {
      const { multiSelectionActive: w, edgeLookup: U, nodeLookup: _, triggerNodeChanges: A, triggerEdgeChanges: j } = E();
      if (w) {
        const B = N.map((R) => ga(R, !0));
        j(B);
        return;
      }
      j(xi(U, /* @__PURE__ */ new Set([...N]))), A(xi(_, /* @__PURE__ */ new Set()));
    },
    unselectNodesAndEdges: ({ nodes: N, edges: w } = {}) => {
      const { edges: U, nodes: _, nodeLookup: A, triggerNodeChanges: j, triggerEdgeChanges: B } = E(), R = N || _, Z = w || U, J = [];
      for (const tt of R)
        tt.selected && J.push(ga(tt.id, !1));
      const it = [];
      for (const tt of Z)
        tt.selected && it.push(ga(tt.id, !1));
      j(J), B(it);
    },
    setMinZoom: (N) => {
      const { panZoom: w, maxZoom: U } = E();
      w?.setScaleExtent([N, U]), b({ minZoom: N });
    },
    setMaxZoom: (N) => {
      const { panZoom: w, minZoom: U } = E();
      w?.setScaleExtent([U, N]), b({ maxZoom: N });
    },
    setTranslateExtent: (N) => {
      E().panZoom?.setTranslateExtent(N), b({ translateExtent: N });
    },
    resetSelectedElements: () => {
      const { edges: N, nodes: w, triggerNodeChanges: U, triggerEdgeChanges: _, elementsSelectable: A } = E();
      if (!A)
        return;
      const j = w.reduce((R, Z) => Z.selected ? [...R, ga(Z.id, !1)] : R, []), B = N.reduce((R, Z) => Z.selected ? [...R, ga(Z.id, !1)] : R, []);
      U(j), _(B);
    },
    setNodeExtent: (N) => {
      const { nodes: w, nodeLookup: U, parentLookup: _, nodeOrigin: A, elevateNodesOnSelect: j, nodeExtent: B, zIndexMode: R } = E();
      N[0][0] === B[0][0] && N[0][1] === B[0][1] && N[1][0] === B[1][0] && N[1][1] === B[1][1] || (Gd(w, U, _, {
        nodeOrigin: A,
        nodeExtent: N,
        elevateNodesOnSelect: j,
        checkEquality: !1,
        zIndexMode: R
      }), b({ nodeExtent: N }));
    },
    panBy: (N) => {
      const { transform: w, width: U, height: _, panZoom: A, translateExtent: j } = E();
      return Iw({ delta: N, panZoom: A, transform: w, translateExtent: j, width: U, height: _ });
    },
    setCenter: async (N, w, U) => {
      const { width: _, height: A, maxZoom: j, panZoom: B } = E();
      if (!B)
        return !1;
      const R = typeof U?.zoom < "u" ? U.zoom : j;
      return await B.setViewport({
        x: _ / 2 - N * R,
        y: A / 2 - w * R,
        zoom: R
      }, { duration: U?.duration, ease: U?.ease, interpolate: U?.interpolate }), !0;
    },
    cancelConnection: () => {
      b({
        connection: { ...Bp }
      });
    },
    updateConnection: (N) => {
      b({ connection: N });
    },
    reset: () => b({ ...Gv() })
  };
}, Object.is);
function vT({ initialNodes: l, initialEdges: i, defaultNodes: o, defaultEdges: r, initialWidth: s, initialHeight: f, initialMinZoom: d, initialMaxZoom: g, initialFitViewOptions: S, fitView: v, nodeOrigin: y, nodeExtent: m, zIndexMode: p, children: b }) {
  const [E] = P.useState(() => yT({
    nodes: l,
    edges: i,
    defaultNodes: o,
    defaultEdges: r,
    width: s,
    height: f,
    fitView: v,
    minZoom: d,
    maxZoom: g,
    fitViewOptions: S,
    nodeOrigin: y,
    nodeExtent: m,
    zIndexMode: p
  }));
  return W.jsx(A3, { value: E, children: W.jsx(eN, { children: W.jsx(yN, { children: b }) }) });
}
function pT({ children: l, nodes: i, edges: o, defaultNodes: r, defaultEdges: s, width: f, height: d, fitView: g, fitViewOptions: S, minZoom: v, maxZoom: y, nodeOrigin: m, nodeExtent: p, zIndexMode: b }) {
  return P.useContext(br) ? W.jsx(W.Fragment, { children: l }) : W.jsx(vT, { initialNodes: i, initialEdges: o, defaultNodes: r, defaultEdges: s, initialWidth: f, initialHeight: d, fitView: g, initialFitViewOptions: S, initialMinZoom: v, initialMaxZoom: y, nodeOrigin: m, nodeExtent: p, zIndexMode: b, children: l });
}
const ST = {
  width: "100%",
  height: "100%",
  overflow: "hidden",
  position: "relative",
  zIndex: 0
};
function xT({ nodes: l, edges: i, defaultNodes: o, defaultEdges: r, className: s, nodeTypes: f, edgeTypes: d, onNodeClick: g, onEdgeClick: S, onInit: v, onMove: y, onMoveStart: m, onMoveEnd: p, onConnect: b, onConnectStart: E, onConnectEnd: C, onClickConnectStart: N, onClickConnectEnd: w, onNodeMouseEnter: U, onNodeMouseMove: _, onNodeMouseLeave: A, onNodeContextMenu: j, onNodeDoubleClick: B, onNodeDragStart: R, onNodeDrag: Z, onNodeDragStop: J, onNodesDelete: it, onEdgesDelete: tt, onDelete: ot, onSelectionChange: lt, onSelectionDragStart: M, onSelectionDrag: V, onSelectionDragStop: O, onSelectionContextMenu: H, onSelectionStart: X, onSelectionEnd: K, onBeforeDelete: F, connectionMode: at, connectionLineType: dt = Ll.Bezier, connectionLineStyle: pt, connectionLineComponent: T, connectionLineContainerStyle: k, deleteKeyCode: st = "Backspace", selectionKeyCode: ut = "Shift", selectionOnDrag: I = !1, selectionMode: ft = Qu.Full, panActivationKeyCode: gt = "Space", multiSelectionKeyCode: ct = $u() ? "Meta" : "Control", zoomActivationKeyCode: rt = $u() ? "Meta" : "Control", snapToGrid: vt, snapGrid: wt, onlyRenderVisibleElements: _t = !1, selectNodesOnDrag: Mt, nodesDraggable: Ht, autoPanOnNodeFocus: Ot, nodesConnectable: Pt, nodesFocusable: xe, nodeOrigin: re = g1, edgesFocusable: En, edgesReconnectable: Ie, elementsSelectable: Oe = !0, defaultViewport: _e = Z3, minZoom: De = 0.5, maxZoom: Ve = 2, translateExtent: _n = Gu, preventScrolling: ke = !0, nodeExtent: jl, defaultMarkerColor: Hi = "#b1b1b7", zoomOnScroll: Nr = !0, zoomOnPinch: no = !0, panOnScroll: Ui = !1, panOnScrollSpeed: Bi = 0.5, panOnScrollMode: Yi = pa.Free, zoomOnDoubleClick: Tr = !0, panOnDrag: Mr = !0, onPaneClick: we, onPaneMouseEnter: zr, onPaneMouseMove: lo, onPaneMouseLeave: ao, onPaneScroll: Na, onPaneContextMenu: Cr, paneClickDistance: io = 1, nodeClickDistance: Ar = 0, children: Or, onReconnect: Zl, onReconnectStart: Ne, onReconnectEnd: wn, onEdgeContextMenu: Te, onEdgeDoubleClick: Dr, onEdgeMouseEnter: Rr, onEdgeMouseMove: Hr, onEdgeMouseLeave: Ta, reconnectRadius: Ma = 10, onNodesChange: za, onEdgesChange: qn, noDragClassName: Ca = "nodrag", noWheelClassName: Gl = "nowheel", noPanClassName: Vi = "nopan", fitView: uo, fitViewOptions: Li, connectOnClick: qi, attributionPosition: Ql, proOptions: Ur, defaultEdgeOptions: oo, elevateNodesOnSelect: co = !0, elevateEdgesOnSelect: ro = !1, disableKeyboardA11y: Aa = !1, autoPanOnConnect: Xi, autoPanOnNodeDrag: so, autoPanOnSelection: fo = !0, autoPanSpeed: on, connectionRadius: oe, isValidConnection: be, onError: ol, style: ho, id: go, nodeDragThreshold: Br, connectionDragThreshold: mo, viewport: Kl, onViewportChange: Oa, width: Da, height: Xn, colorMode: cl = "light", debug: $l, onScroll: jn, ariaLabelConfig: ee, zIndexMode: ji = "basic", ...yo }, vo) {
  const cn = go || "1", rl = $3(cl), Yr = P.useCallback((Zi) => {
    Zi.currentTarget.scrollTo({ top: 0, left: 0, behavior: "instant" }), jn?.(Zi);
  }, [jn]);
  return W.jsx("div", { "data-testid": "rf__wrapper", ...yo, onScroll: Yr, style: { ...ho, ...ST }, ref: vo, className: ue(["react-flow", s, rl]), id: go, role: "application", children: W.jsxs(pT, { nodes: l, edges: i, width: Da, height: Xn, fitView: uo, fitViewOptions: Li, minZoom: De, maxZoom: Ve, nodeOrigin: re, nodeExtent: jl, zIndexMode: ji, children: [W.jsx(K3, { nodes: l, edges: i, defaultNodes: o, defaultEdges: r, onConnect: b, onConnectStart: E, onConnectEnd: C, onClickConnectStart: N, onClickConnectEnd: w, nodesDraggable: Ht, autoPanOnNodeFocus: Ot, nodesConnectable: Pt, nodesFocusable: xe, edgesFocusable: En, edgesReconnectable: Ie, elementsSelectable: Oe, elevateNodesOnSelect: co, elevateEdgesOnSelect: ro, minZoom: De, maxZoom: Ve, nodeExtent: jl, onNodesChange: za, onEdgesChange: qn, snapToGrid: vt, snapGrid: wt, connectionMode: at, translateExtent: _n, connectOnClick: qi, defaultEdgeOptions: oo, fitView: uo, fitViewOptions: Li, onNodesDelete: it, onEdgesDelete: tt, onDelete: ot, onNodeDragStart: R, onNodeDrag: Z, onNodeDragStop: J, onSelectionDrag: V, onSelectionDragStart: M, onSelectionDragStop: O, onMove: y, onMoveStart: m, onMoveEnd: p, noPanClassName: Vi, nodeOrigin: re, rfId: cn, autoPanOnConnect: Xi, autoPanOnNodeDrag: so, autoPanSpeed: on, onError: ol, connectionRadius: oe, isValidConnection: be, selectNodesOnDrag: Mt, nodeDragThreshold: Br, connectionDragThreshold: mo, onBeforeDelete: F, debug: $l, ariaLabelConfig: ee, zIndexMode: ji }), W.jsx(gT, { onInit: v, onNodeClick: g, onEdgeClick: S, onNodeMouseEnter: U, onNodeMouseMove: _, onNodeMouseLeave: A, onNodeContextMenu: j, onNodeDoubleClick: B, nodeTypes: f, edgeTypes: d, connectionLineType: dt, connectionLineStyle: pt, connectionLineComponent: T, connectionLineContainerStyle: k, selectionKeyCode: ut, selectionOnDrag: I, selectionMode: ft, deleteKeyCode: st, multiSelectionKeyCode: ct, panActivationKeyCode: gt, zoomActivationKeyCode: rt, onlyRenderVisibleElements: _t, defaultViewport: _e, translateExtent: _n, minZoom: De, maxZoom: Ve, preventScrolling: ke, zoomOnScroll: Nr, zoomOnPinch: no, zoomOnDoubleClick: Tr, panOnScroll: Ui, panOnScrollSpeed: Bi, panOnScrollMode: Yi, panOnDrag: Mr, autoPanOnSelection: fo, onPaneClick: we, onPaneMouseEnter: zr, onPaneMouseMove: lo, onPaneMouseLeave: ao, onPaneScroll: Na, onPaneContextMenu: Cr, paneClickDistance: io, nodeClickDistance: Ar, onSelectionContextMenu: H, onSelectionStart: X, onSelectionEnd: K, onReconnect: Zl, onReconnectStart: Ne, onReconnectEnd: wn, onEdgeContextMenu: Te, onEdgeDoubleClick: Dr, onEdgeMouseEnter: Rr, onEdgeMouseMove: Hr, onEdgeMouseLeave: Ta, reconnectRadius: Ma, defaultMarkerColor: Hi, noDragClassName: Ca, noWheelClassName: Gl, noPanClassName: Vi, rfId: cn, disableKeyboardA11y: Aa, nodeExtent: jl, viewport: Kl, onViewportChange: Oa, nodesDraggable: Ht }), W.jsx(j3, { onSelectionChange: lt }), Or, W.jsx(Y3, { proOptions: Ur, position: Ql }), W.jsx(B3, { rfId: cn, disableKeyboardA11y: Aa })] }) });
}
var bT = v1(xT);
function ET(l) {
  const [i, o] = P.useState(l), r = P.useCallback((s) => o((f) => y1(s, f)), []);
  return [i, o, r];
}
function _T({ dimensions: l, lineWidth: i, variant: o, className: r }) {
  return W.jsx("path", { strokeWidth: i, d: `M${l[0] / 2} 0 V${l[1]} M0 ${l[1] / 2} H${l[0]}`, className: ue(["react-flow__background-pattern", o, r]) });
}
function wT({ radius: l, className: i }) {
  return W.jsx("circle", { cx: l, cy: l, r: l, className: ue(["react-flow__background-pattern", "dots", i]) });
}
var ql;
(function(l) {
  l.Lines = "lines", l.Dots = "dots", l.Cross = "cross";
})(ql || (ql = {}));
const NT = {
  [ql.Dots]: 1,
  [ql.Lines]: 1,
  [ql.Cross]: 6
}, TT = (l) => ({ transform: l.transform, patternId: `pattern-${l.rfId}` });
function Z1({
  id: l,
  variant: i = ql.Dots,
  // only used for dots and cross
  gap: o = 20,
  // only used for lines and cross
  size: r,
  lineWidth: s = 1,
  offset: f = 0,
  color: d,
  bgColor: g,
  style: S,
  className: v,
  patternClassName: y
}) {
  const m = P.useRef(null), { transform: p, patternId: b } = Bt(TT, kt), E = r || NT[i], C = i === ql.Dots, N = i === ql.Cross, w = Array.isArray(o) ? o : [o, o], U = [w[0] * p[2] || 1, w[1] * p[2] || 1], _ = E * p[2], A = Array.isArray(f) ? f : [f, f], j = N ? [_, _] : U, B = [
    A[0] * p[2] + j[0] / 2,
    A[1] * p[2] + j[1] / 2
  ], R = `${b}${l || ""}`;
  return W.jsxs("svg", { className: ue(["react-flow__background", v]), style: {
    ...S,
    ..._r,
    "--xy-background-color-props": g,
    "--xy-background-pattern-color-props": d
  }, ref: m, "data-testid": "rf__background", children: [W.jsx("pattern", { id: R, x: p[0] % U[0], y: p[1] % U[1], width: U[0], height: U[1], patternUnits: "userSpaceOnUse", patternTransform: `translate(-${B[0]},-${B[1]})`, children: C ? W.jsx(wT, { radius: _ / 2, className: y }) : W.jsx(_T, { dimensions: j, lineWidth: s, variant: i, className: y }) }), W.jsx("rect", { x: "0", y: "0", width: "100%", height: "100%", fill: `url(#${R})` })] });
}
Z1.displayName = "Background";
const MT = P.memo(Z1);
function zT() {
  return W.jsx("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 32 32", children: W.jsx("path", { d: "M32 18.133H18.133V32h-4.266V18.133H0v-4.266h13.867V0h4.266v13.867H32z" }) });
}
function CT() {
  return W.jsx("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 32 5", children: W.jsx("path", { d: "M0 0h32v4.2H0z" }) });
}
function AT() {
  return W.jsx("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 32 30", children: W.jsx("path", { d: "M3.692 4.63c0-.53.4-.938.939-.938h5.215V0H4.708C2.13 0 0 2.054 0 4.63v5.216h3.692V4.631zM27.354 0h-5.2v3.692h5.17c.53 0 .984.4.984.939v5.215H32V4.631A4.624 4.624 0 0027.354 0zm.954 24.83c0 .532-.4.94-.939.94h-5.215v3.768h5.215c2.577 0 4.631-2.13 4.631-4.707v-5.139h-3.692v5.139zm-23.677.94c-.531 0-.939-.4-.939-.94v-5.138H0v5.139c0 2.577 2.13 4.707 4.708 4.707h5.138V25.77H4.631z" }) });
}
function OT() {
  return W.jsx("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 25 32", children: W.jsx("path", { d: "M21.333 10.667H19.81V7.619C19.81 3.429 16.38 0 12.19 0 8 0 4.571 3.429 4.571 7.619v3.048H3.048A3.056 3.056 0 000 13.714v15.238A3.056 3.056 0 003.048 32h18.285a3.056 3.056 0 003.048-3.048V13.714a3.056 3.056 0 00-3.048-3.047zM12.19 24.533a3.056 3.056 0 01-3.047-3.047 3.056 3.056 0 013.047-3.048 3.056 3.056 0 013.048 3.048 3.056 3.056 0 01-3.048 3.047zm4.724-13.866H7.467V7.619c0-2.59 2.133-4.724 4.723-4.724 2.591 0 4.724 2.133 4.724 4.724v3.048z" }) });
}
function DT() {
  return W.jsx("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 25 32", children: W.jsx("path", { d: "M21.333 10.667H19.81V7.619C19.81 3.429 16.38 0 12.19 0c-4.114 1.828-1.37 2.133.305 2.438 1.676.305 4.42 2.59 4.42 5.181v3.048H3.047A3.056 3.056 0 000 13.714v15.238A3.056 3.056 0 003.048 32h18.285a3.056 3.056 0 003.048-3.048V13.714a3.056 3.056 0 00-3.048-3.047zM12.19 24.533a3.056 3.056 0 01-3.047-3.047 3.056 3.056 0 013.047-3.048 3.056 3.056 0 013.048 3.048 3.056 3.056 0 01-3.048 3.047z" }) });
}
function Kc({ children: l, className: i, ...o }) {
  return W.jsx("button", { type: "button", className: ue(["react-flow__controls-button", i]), ...o, children: l });
}
const RT = (l) => ({
  isInteractive: l.nodesDraggable || l.nodesConnectable || l.elementsSelectable,
  minZoomReached: l.transform[2] <= l.minZoom,
  maxZoomReached: l.transform[2] >= l.maxZoom,
  ariaLabelConfig: l.ariaLabelConfig
});
function G1({ style: l, showZoom: i = !0, showFitView: o = !0, showInteractive: r = !0, fitViewOptions: s, onZoomIn: f, onZoomOut: d, onFitView: g, onInteractiveChange: S, className: v, children: y, position: m = "bottom-left", orientation: p = "vertical", "aria-label": b }) {
  const E = $t(), { isInteractive: C, minZoomReached: N, maxZoomReached: w, ariaLabelConfig: U } = Bt(RT, kt), { zoomIn: _, zoomOut: A, fitView: j } = mh(), B = () => {
    _(), f?.();
  }, R = () => {
    A(), d?.();
  }, Z = () => {
    j(s), g?.();
  }, J = () => {
    E.setState({
      nodesDraggable: !C,
      nodesConnectable: !C,
      elementsSelectable: !C
    }), S?.(!C);
  }, it = p === "horizontal" ? "horizontal" : "vertical";
  return W.jsxs(Er, { className: ue(["react-flow__controls", it, v]), position: m, style: l, "data-testid": "rf__controls", "aria-label": b ?? U["controls.ariaLabel"], children: [i && W.jsxs(W.Fragment, { children: [W.jsx(Kc, { onClick: B, className: "react-flow__controls-zoomin", title: U["controls.zoomIn.ariaLabel"], "aria-label": U["controls.zoomIn.ariaLabel"], disabled: w, children: W.jsx(zT, {}) }), W.jsx(Kc, { onClick: R, className: "react-flow__controls-zoomout", title: U["controls.zoomOut.ariaLabel"], "aria-label": U["controls.zoomOut.ariaLabel"], disabled: N, children: W.jsx(CT, {}) })] }), o && W.jsx(Kc, { className: "react-flow__controls-fitview", onClick: Z, title: U["controls.fitView.ariaLabel"], "aria-label": U["controls.fitView.ariaLabel"], children: W.jsx(AT, {}) }), r && W.jsx(Kc, { className: "react-flow__controls-interactive", onClick: J, title: U["controls.interactive.ariaLabel"], "aria-label": U["controls.interactive.ariaLabel"], children: C ? W.jsx(DT, {}) : W.jsx(OT, {}) }), y] });
}
G1.displayName = "Controls";
const HT = P.memo(G1);
function UT({ id: l, x: i, y: o, width: r, height: s, style: f, color: d, strokeColor: g, strokeWidth: S, className: v, borderRadius: y, shapeRendering: m, selected: p, onClick: b }) {
  const { background: E, backgroundColor: C } = f || {}, N = d || E || C;
  return W.jsx("rect", { className: ue(["react-flow__minimap-node", { selected: p }, v]), x: i, y: o, rx: y, ry: y, width: r, height: s, style: {
    fill: N,
    stroke: g,
    strokeWidth: S
  }, shapeRendering: m, onClick: b ? (w) => b(w, l) : void 0 });
}
const BT = P.memo(UT), YT = (l) => l.nodes.map((i) => i.id), Od = (l) => l instanceof Function ? l : () => l;
function VT({
  nodeStrokeColor: l,
  nodeColor: i,
  nodeClassName: o = "",
  nodeBorderRadius: r = 5,
  nodeStrokeWidth: s,
  /*
   * We need to rename the prop to be `CapitalCase` so that JSX will render it as
   * a component properly.
   */
  nodeComponent: f = BT,
  onClick: d
}) {
  const g = Bt(YT, kt), S = Od(i), v = Od(l), y = Od(o), m = typeof window > "u" || window.chrome ? "crispEdges" : "geometricPrecision";
  return W.jsx(W.Fragment, { children: g.map((p) => (
    /*
     * The split of responsibilities between MiniMapNodes and
     * NodeComponentWrapper may appear weird. However, it’s designed to
     * minimize the cost of updates when individual nodes change.
     *
     * For more details, see a similar commit in `NodeRenderer/index.tsx`.
     */
    W.jsx(qT, { id: p, nodeColorFunc: S, nodeStrokeColorFunc: v, nodeClassNameFunc: y, nodeBorderRadius: r, nodeStrokeWidth: s, NodeComponent: f, onClick: d, shapeRendering: m }, p)
  )) });
}
function LT({ id: l, nodeColorFunc: i, nodeStrokeColorFunc: o, nodeClassNameFunc: r, nodeBorderRadius: s, nodeStrokeWidth: f, shapeRendering: d, NodeComponent: g, onClick: S }) {
  const { node: v, x: y, y: m, width: p, height: b } = Bt((E) => {
    const C = E.nodeLookup.get(l);
    if (!C)
      return { node: void 0, x: 0, y: 0, width: 0, height: 0 };
    const N = C.internals.userNode, { x: w, y: U } = C.internals.positionAbsolute, { width: _, height: A } = bn(N);
    return {
      node: N,
      x: w,
      y: U,
      width: _,
      height: A
    };
  }, kt);
  return !v || v.hidden || !Zp(v) ? null : W.jsx(g, { x: y, y: m, width: p, height: b, style: v.style, selected: !!v.selected, className: r(v), color: i(v), borderRadius: s, strokeColor: o(v), strokeWidth: f, shapeRendering: d, onClick: S, id: v.id });
}
const qT = P.memo(LT);
var XT = P.memo(VT);
const jT = 200, ZT = 150, GT = (l) => !l.hidden, QT = (l) => {
  const i = {
    x: -l.transform[0] / l.transform[2],
    y: -l.transform[1] / l.transform[2],
    width: l.width / l.transform[2],
    height: l.height / l.transform[2]
  };
  let o = !1;
  for (const r of l.nodeLookup.values())
    if (!r.hidden) {
      o = !0;
      break;
    }
  return {
    viewBB: i,
    boundingRect: o ? qp(Pu(l.nodeLookup, { filter: GT }), i) : i,
    rfId: l.rfId,
    panZoom: l.panZoom,
    translateExtent: l.translateExtent,
    flowWidth: l.width,
    flowHeight: l.height,
    ariaLabelConfig: l.ariaLabelConfig
  };
}, Qv = (l, i) => l.x === i.x && l.y === i.y && l.width === i.width && l.height === i.height, KT = (l, i) => Qv(l.viewBB, i.viewBB) && Qv(l.boundingRect, i.boundingRect) && l.rfId === i.rfId && l.panZoom === i.panZoom && l.translateExtent === i.translateExtent && l.flowWidth === i.flowWidth && l.flowHeight === i.flowHeight && l.ariaLabelConfig === i.ariaLabelConfig, $T = "react-flow__minimap-desc";
function Q1({
  style: l,
  className: i,
  nodeStrokeColor: o,
  nodeColor: r,
  nodeClassName: s = "",
  nodeBorderRadius: f = 5,
  nodeStrokeWidth: d,
  /*
   * We need to rename the prop to be `CapitalCase` so that JSX will render it as
   * a component properly.
   */
  nodeComponent: g,
  bgColor: S,
  maskColor: v,
  maskStrokeColor: y,
  maskStrokeWidth: m,
  position: p = "bottom-right",
  onClick: b,
  onNodeClick: E,
  pannable: C = !1,
  zoomable: N = !1,
  ariaLabel: w,
  inversePan: U,
  zoomStep: _ = 1,
  offsetScale: A = 5
}) {
  const j = $t(), B = P.useRef(null), { boundingRect: R, panZoom: Z, viewBB: J, rfId: it, translateExtent: tt, flowWidth: ot, flowHeight: lt, ariaLabelConfig: M } = Bt(QT, KT), V = l?.width ?? jT, O = l?.height ?? ZT, H = R.width / V, X = R.height / O, K = Math.max(H, X), F = K * V, at = K * O, dt = A * K, pt = R.x - (F - R.width) / 2 - dt, T = R.y - (at - R.height) / 2 - dt, k = F + dt * 2, st = at + dt * 2, ut = `${$T}-${it}`, I = P.useRef(0), ft = P.useRef();
  I.current = K, P.useEffect(() => {
    const wt = j.getState().panZoom;
    if (B.current && wt)
      return ft.current = a3({
        domNode: B.current,
        panZoom: wt,
        getTransform: () => j.getState().transform,
        getViewScale: () => I.current
      }), () => {
        ft.current?.destroy();
      };
  }, [Z]), P.useEffect(() => {
    ft.current?.update({
      translateExtent: tt,
      width: ot,
      height: lt,
      inversePan: U,
      pannable: C,
      zoomStep: _,
      zoomable: N
    });
  }, [C, N, U, _, tt, ot, lt]);
  const gt = b ? (wt) => {
    const [_t, Mt] = ft.current?.pointer(wt) || [0, 0];
    b(wt, { x: _t, y: Mt });
  } : void 0, ct = P.useCallback((wt, _t) => {
    const Mt = j.getState().nodeLookup.get(_t).internals.userNode;
    E?.(wt, Mt);
  }, [E]), rt = E ? ct : void 0, vt = w ?? M["minimap.ariaLabel"];
  return W.jsx(Er, { position: p, style: {
    ...l,
    "--xy-minimap-background-color-props": typeof S == "string" ? S : void 0,
    "--xy-minimap-mask-background-color-props": typeof v == "string" ? v : void 0,
    "--xy-minimap-mask-stroke-color-props": typeof y == "string" ? y : void 0,
    "--xy-minimap-mask-stroke-width-props": typeof m == "number" ? m * K : void 0,
    "--xy-minimap-node-background-color-props": typeof r == "string" ? r : void 0,
    "--xy-minimap-node-stroke-color-props": typeof o == "string" ? o : void 0,
    "--xy-minimap-node-stroke-width-props": typeof d == "number" ? d : void 0
  }, className: ue(["react-flow__minimap", i]), "data-testid": "rf__minimap", children: W.jsxs("svg", { width: V, height: O, viewBox: `${pt} ${T} ${k} ${st}`, className: "react-flow__minimap-svg", role: "img", "aria-labelledby": ut, ref: B, onClick: gt, children: [vt && W.jsx("title", { id: ut, children: vt }), W.jsx(XT, { onClick: rt, nodeColor: r, nodeStrokeColor: o, nodeBorderRadius: f, nodeClassName: s, nodeStrokeWidth: d, nodeComponent: g }), W.jsx("path", { className: "react-flow__minimap-mask", d: `M${pt - dt},${T - dt}h${k + dt * 2}v${st + dt * 2}h${-k - dt * 2}z
        M${J.x},${J.y}h${J.width}v${J.height}h${-J.width}z`, fillRule: "evenodd", pointerEvents: "none" })] }) });
}
Q1.displayName = "MiniMap";
P.memo(Q1);
const JT = (l) => (i) => l ? `${Math.max(1 / i.transform[2], 1)}` : void 0, IT = {
  [Di.Line]: "right",
  [Di.Handle]: "bottom-right"
};
function kT({ nodeId: l, position: i, variant: o = Di.Handle, className: r, style: s = void 0, children: f, color: d, minWidth: g = 10, minHeight: S = 10, maxWidth: v = Number.MAX_VALUE, maxHeight: y = Number.MAX_VALUE, keepAspectRatio: m = !1, resizeDirection: p, autoScale: b = !0, shouldResize: E, onResizeStart: C, onResize: N, onResizeEnd: w }) {
  const U = E1(), _ = typeof l == "string" ? l : U, A = $t(), j = P.useRef(null), B = o === Di.Handle, R = Bt(P.useCallback(JT(B && b), [B, b]), kt), Z = P.useRef(null), J = i ?? IT[o];
  P.useEffect(() => {
    if (!(!j.current || !_))
      return Z.current || (Z.current = v3({
        domNode: j.current,
        nodeId: _,
        getStoreItems: () => {
          const { nodeLookup: tt, transform: ot, snapGrid: lt, snapToGrid: M, nodeOrigin: V, domNode: O } = A.getState();
          return {
            nodeLookup: tt,
            transform: ot,
            snapGrid: lt,
            snapToGrid: M,
            nodeOrigin: V,
            paneDomNode: O
          };
        },
        onChange: (tt, ot) => {
          const { triggerNodeChanges: lt, nodeLookup: M, parentLookup: V, nodeOrigin: O } = A.getState(), H = [], X = { x: tt.x, y: tt.y }, K = M.get(_);
          if (K && K.expandParent && K.parentId) {
            const F = K.origin ?? O, at = tt.width ?? K.measured.width ?? 0, dt = tt.height ?? K.measured.height ?? 0, pt = {
              id: K.id,
              parentId: K.parentId,
              rect: {
                width: at,
                height: dt,
                ...Gp({
                  x: tt.x ?? K.position.x,
                  y: tt.y ?? K.position.y
                }, { width: at, height: dt }, K.parentId, M, F)
              }
            }, T = gh([pt], M, V, O);
            H.push(...T), X.x = tt.x ? Math.max(F[0] * at, tt.x) : void 0, X.y = tt.y ? Math.max(F[1] * dt, tt.y) : void 0;
          }
          if (X.x !== void 0 && X.y !== void 0) {
            const F = {
              id: _,
              type: "position",
              position: { ...X }
            };
            H.push(F);
          }
          if (tt.width !== void 0 && tt.height !== void 0) {
            const at = {
              id: _,
              type: "dimensions",
              resizing: !0,
              setAttributes: p ? p === "horizontal" ? "width" : "height" : !0,
              dimensions: {
                width: tt.width,
                height: tt.height
              }
            };
            H.push(at);
          }
          for (const F of ot) {
            const at = {
              ...F,
              type: "position"
            };
            H.push(at);
          }
          lt(H);
        },
        onEnd: ({ width: tt, height: ot }) => {
          const lt = {
            id: _,
            type: "dimensions",
            resizing: !1,
            dimensions: {
              width: tt,
              height: ot
            }
          };
          A.getState().triggerNodeChanges([lt]);
        }
      })), Z.current.update({
        controlPosition: J,
        boundaries: {
          minWidth: g,
          minHeight: S,
          maxWidth: v,
          maxHeight: y
        },
        keepAspectRatio: m,
        resizeDirection: p,
        onResizeStart: C,
        onResize: N,
        onResizeEnd: w,
        shouldResize: E
      }), () => {
        Z.current?.destroy();
      };
  }, [
    J,
    g,
    S,
    v,
    y,
    m,
    C,
    N,
    w,
    E
  ]);
  const it = J.split("-");
  return W.jsx("div", { className: ue(["react-flow__resize-control", "nodrag", ...it, o, r]), ref: j, style: {
    ...s,
    scale: R,
    ...d && { [B ? "backgroundColor" : "borderColor"]: d }
  }, children: f });
}
P.memo(kT);
function FT({ nodes: l, edges: i, onSelect: o, onMove: r }) {
  const [s, , f] = ET(l.map((d, g) => ({ id: d.id, position: d.position || { x: g * 230, y: g % 2 * 80 }, data: { label: `${d.label} · ${d.state || "Sin estado"}` } })));
  return /* @__PURE__ */ Si.createElement("div", { style: { width: "100%", height: "100%" }, onKeyDownCapture: (d) => {
    const g = d.target.closest?.(".react-flow__node");
    g && ["Enter", " "].includes(d.key) && (d.preventDefault(), d.stopPropagation(), o?.(g.dataset.id));
  } }, /* @__PURE__ */ Si.createElement(bT, { nodes: s, edges: i.map((d, g) => ({ ...d, id: d.id || `edge-${g}` })), onNodesChange: f, onNodeClick: (d, g) => o?.(g.id), onNodeDragStop: (d, g) => r?.(g.id, g.position), nodesConnectable: !1, fitView: !0, minZoom: 0.2, maxZoom: 2, ariaLabelConfig: { "node.a11yDescription.default": "Pulsa Enter para seleccionar un nodo. Usa las flechas para moverlo.", "controls.zoomIn.ariaLabel": "Acercar", "controls.zoomOut.ariaLabel": "Alejar", "controls.fitView.ariaLabel": "Ajustar vista" } }, /* @__PURE__ */ Si.createElement(MT, { gap: 20, color: "var(--ui-line)" }), /* @__PURE__ */ Si.createElement(HT, { showInteractive: !1 })));
}
function WT(l, i) {
  const o = Rb.createRoot(l);
  return o.render(/* @__PURE__ */ Si.createElement(FT, { ...i })), () => o.unmount();
}
export {
  WT as mountFlow
};
