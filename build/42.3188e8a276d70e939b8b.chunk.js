(window.webpackJsonp=window.webpackJsonp||[]).push([[42],{a5e146f1f3de3987ce62:function(e,t,o){"use strict";o.r(t);var n,r=o("8af190b70a6bc55c6f1b"),i=o.n(r),a=o("0d7f0986bcd2f33d8a2a"),c=o("1037a6e0d5914309f74c"),f=o.n(c),u=(o("8a2d1b95e05b6a321e74"),o("6938d226fd372a75cbf9")),l=o("4dd2a92e69dcbe1bab10"),s=o("387190e83edf0e5eb8f6"),p=o("37d5df45f7f2aa661f16"),b=o.n(p);function d(e){return(d="function"===typeof Symbol&&"symbol"===typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"===typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function y(e,t,o,r){n||(n="function"===typeof Symbol&&Symbol.for&&Symbol.for("react.element")||60103);var i=e&&e.defaultProps,a=arguments.length-3;if(t||0===a||(t={children:void 0}),t&&i)for(var c in i)void 0===t[c]&&(t[c]=i[c]);else t||(t=i||{});if(1===a)t.children=r;else if(a>1){for(var f=new Array(a),u=0;u<a;u++)f[u]=arguments[u+3];t.children=f}return{$$typeof:n,type:e,key:void 0===o?null:""+o,ref:null,props:t,_owner:null}}function m(e,t){for(var o=0;o<t.length;o++){var n=t[o];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}function v(e){return(v=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}function w(e,t){return(w=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function h(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}var O=function(e){function t(){var e,o,n,r,i,a,c;!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,t);for(var f=arguments.length,u=new Array(f),l=0;l<f;l++)u[l]=arguments[l];return n=this,o=!(r=(e=v(t)).call.apply(e,[this].concat(u)))||"object"!==d(r)&&"function"!==typeof r?h(n):r,i=h(h(o)),c={valueForm:[]},(a="state")in i?Object.defineProperty(i,a,{value:c,enumerable:!0,configurable:!0,writable:!0}):i[a]=c,o}var o,n,r;return function(e,t){if("function"!==typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&w(e,t)}(t,i.a.Component),o=t,(n=[{key:"submitForm",value:function(e){var t=this;setTimeout(function(){t.setState({valueForm:e})},500)}},{key:"render",value:function(){var e=this,t=f.a.name+" - Reset Password",o=f.a.desc,n=this.props.classes;return y("div",{className:n.root},void 0,y(a.Helmet,{},void 0,y("title",{},void 0,t),y("meta",{name:"description",content:o}),y("meta",{property:"og:title",content:t}),y("meta",{property:"og:description",content:o}),y("meta",{property:"twitter:title",content:t}),y("meta",{property:"twitter:description",content:o})),y("div",{className:n.container},void 0,y("div",{className:n.userFormWrap},void 0,y(b.a,{delay:500},void 0,y(l.i,{onSubmit:function(t){return e.submitForm(t)}})))))}}])&&m(o.prototype,n),r&&m(o,r),t}();t.default=Object(u.withStyles)(s.a)(O)}}]);