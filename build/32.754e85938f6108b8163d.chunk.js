(window.webpackJsonp=window.webpackJsonp||[]).push([[32],{"3c3dfc5d66950a6c8d12":function(e,t,o){"use strict";o.r(t);var n,a=o("8af190b70a6bc55c6f1b"),i=o.n(a),r=o("0d7f0986bcd2f33d8a2a"),l=o("1037a6e0d5914309f74c"),s=o.n(l),d=o("f84a5334c4512e25b746"),c=o.n(d),f=o("031191083d7a21fda934"),u=o.n(f),p=o("ffe79a4c96e5f2b030ea"),b=(o("921c0b8c557fe6ba5da8"),o("6938d226fd372a75cbf9")),h=o("2aea235afd5c55b8b19b"),y=o.n(h),m=o("be638c054224589367e1"),g=o.n(m),v=o("d4df020feb07c4f688e4"),S=o.n(v),w=o("cfb02eb836b80521726b"),O=o("4cad7676f6ad23a52c95");function R(e){return(R="function"===typeof Symbol&&"symbol"===typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"===typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function C(e,t,o,a){n||(n="function"===typeof Symbol&&Symbol.for&&Symbol.for("react.element")||60103);var i=e&&e.defaultProps,r=arguments.length-3;if(t||0===r||(t={children:void 0}),t&&i)for(var l in i)void 0===t[l]&&(t[l]=i[l]);else t||(t=i||{});if(1===r)t.children=a;else if(r>1){for(var s=new Array(r),d=0;d<r;d++)s[d]=arguments[d+3];t.children=s}return{$$typeof:n,type:e,key:void 0===o?null:""+o,ref:null,props:t,_owner:null}}function _(e,t){for(var o=0;o<t.length;o++){var n=t[o];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}function x(e){return(x=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}function A(e,t){return(A=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function D(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function j(e,t,o){return t in e?Object.defineProperty(e,t,{value:o,enumerable:!0,configurable:!0,writable:!0}):e[t]=o,e}var k,P=function(e){function t(){var e,o,n,a;!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,t);for(var i=arguments.length,r=new Array(i),l=0;l<i;l++)r[l]=arguments[l];return n=this,a=(e=x(t)).call.apply(e,[this].concat(r)),o=!a||"object"!==R(a)&&"function"!==typeof a?D(n):a,j(D(D(o)),"state",{columns:[{name:"Campaign",options:{filter:!0}},{name:"Venue",options:{filter:!0}},{name:"Sport",options:{filter:!0}},{name:"Page",options:{filter:!0}},{name:"Region",options:{filter:!0}},{name:"Duration",options:{filter:!0}},{name:"Start Date",options:{filter:!0}},{name:"End Date",options:{filter:!0}},{name:"Position",options:{filter:!0}},{name:"Status",options:{filter:!0,customBodyRender:function(e){return C(g.a,e?{label:"Active",style:{backgroundColor:"#0745ba",color:"#fff"}}:{label:"Non Active",style:{backgroundColor:"#6D6D6D",color:"#fff"}})}}},{name:"Actions",options:{filter:!0,customBodyRender:function(e){return C(w.a,{onChange:o.handleOpen,options:e})}}}]}),j(D(D(o)),"handleOpen",function(e){o.props.onChange(e)}),j(D(D(o)),"getDays",function(e,t){for(var o=O.default.parseZone(e).utc().format(),n=O.default.parseZone(t).utc().format(),a=[],i=Object(O.default)(o);i.diff(n,"days")<=0;i.add(1,"days"))Object(O.default)(o).format("dddd")===i.format("dddd")&&a.push(i.format());return a}),j(D(D(o)),"renderTableRows",function(e){for(var t=[],o=[],n=0;n<e.length;n++){var a=e[n].status?"Disable Ad":"Enable Ad",i=Object(O.default)(e[n].start_date,"YYYY-MM-DD"),r=1+Object(O.default)(e[n].end_date,"YYYY-MM-DD").diff(i,"days")+" days";t=[void 0===e[n].campaign_name?" ":e[n].campaign_name,0==e[n].venue.length?" ":e[n].venue[0].venue.name,void 0==e[n].sport_type?" ":e[n].sport_type,void 0===e[n].page?" ":e[n].page,void 0===e[n].region?" ":e[n].region,void 0===e[n].end_date?" ":r,void 0===e[n].start_date?" ":Object(O.default)(e[n].start_date).format("MMMM DD,ddd"),void 0===e[n].end_date?" ":Object(O.default)(e[n].end_date).parseZone().format("MMMM DD,ddd"),void 0===e[n].position?" ":e[n].position,void 0===e[n].status?" ":e[n].status,[{text:"Edit Ad",id:e[n]._id},{text:"Delete Ad",id:e[n]._id},{text:a,id:e[n]}]],o.push(t)}return o}),o}var o,n,a;return function(e,t){if("function"!==typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&A(e,t)}(t,i.a.Component),o=t,(n=[{key:"render",value:function(){var e=this.state.columns,t=this.props.classes,o=void 0===this.props.adsData?"":this.props.adsData;return C("div",{className:t.table},void 0,C(S.a,{style:{borderRadius:0},title:"Ads Table",data:this.renderTableRows(o),columns:e,options:{options:{filterType:"dropdown",responsive:"stacked",print:!0,onCellClick:function(e,t){},rowsPerPage:10,page:1},selectableRows:!1,rowsPerPage:100,print:!1,download:!1,viewColumns:!1,filter:!1,textLabels:{body:{noMatch:"No Ads found"}}}}))}}])&&_(o.prototype,n),a&&_(o,a),t}(),E=Object(b.withStyles)(function(e){return{table:{"& > div":{borderRadius:0,marginTop:-4,overflow:"auto"},"& table":j({minWidth:500},e.breakpoints.down("md"),{"& td":{height:40}})}}})(P),M=o("4dd2a92e69dcbe1bab10"),L=o("44576350a42448f25ee0"),T=(o("bd183afcc37eabd79225"),o("2e664e825c5258d5f3e4")),I=o("b395c0f340c9a2a77a6e"),B=(o("d7dd51e1bf6bfc2c9c3d"),o("d18f423ecaa6cea6c08f"));o("0e0cb9676ec3dd1d2e27");function W(e){return(W="function"===typeof Symbol&&"symbol"===typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"===typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function Y(e,t){for(var o=0;o<t.length;o++){var n=t[o];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}function N(e){return(N=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}function V(e,t){return(V=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function F(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function $(e,t,o){return t in e?Object.defineProperty(e,t,{value:o,enumerable:!0,configurable:!0,writable:!0}):e[t]=o,e}function H(e,t,o,n){k||(k="function"===typeof Symbol&&Symbol.for&&Symbol.for("react.element")||60103);var a=e&&e.defaultProps,i=arguments.length-3;if(t||0===i||(t={children:void 0}),t&&a)for(var r in a)void 0===t[r]&&(t[r]=a[r]);else t||(t=a||{});if(1===i)t.children=n;else if(i>1){for(var l=new Array(i),s=0;s<i;s++)l[s]=arguments[s+3];t.children=l}return{$$typeof:k,type:e,key:void 0===o?null:""+o,ref:null,props:t,_owner:null}}var U=H(p.a,{}),z=function(e){function t(){var e,o,n,a;!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,t);for(var i=arguments.length,r=new Array(i),l=0;l<i;l++)r[l]=arguments[l];return n=this,a=(e=N(t)).call.apply(e,[this].concat(r)),o=!a||"object"!==W(a)&&"function"!==typeof a?F(n):a,$(F(F(o)),"state",{open:!1,scroll:"paper",value:0,openAlert:!1,openSlide:!1,editData:"",openSnack:!1,loader:!1,option:{},event:"",venue:""}),$(F(F(o)),"handleClickOpenSlide",function(){o.setState({openSlide:!0})}),$(F(F(o)),"handleCloseSlide",function(e,t){o.setState({openSlide:!1,open:!1}),o.getAdsList()}),$(F(F(o)),"onChange",function(e){"Edit Ad"===e.text&&o.setState({open:!0,scroll:scroll,loader:!0},function(){var t=e.id;B.d.post("/api/admin/edit_ad/".concat(t),{},B.c).then(function(e){o.setState({editData:e.data.data,loader:!1})}).catch(function(e){o.setState({loader:!1}),console.log("AXIOS ERROR: ",e)})}),o.setState({option:e}),o.setState({openSlide:!0})}),$(F(F(o)),"handleClose",function(){o.setState({open:!1,openSlide:!1},function(){o.getAdsList()})}),$(F(F(o)),"handleClickOpen",function(e){return function(){o.setState({open:!0,scroll:e})}}),$(F(F(o)),"handleChange",function(e,t){o.setState({value:t},function(){1===t?o.getAdsList():0===t&&o.getAdsList()})}),$(F(F(o)),"getVenueList",function(){if(0===o.state.value){var e=o.state.adsData&&o.state.adsData.filter(function(e){return e.venue.length>0});o.setState({venue:e})}else if(1===o.state.value){var t=o.state.adsData&&o.state.adsData.filter(function(e){return e.event.length>0});o.setState({event:t})}}),$(F(F(o)),"getAdsList",function(){o.setState({loader:!0},function(){B.d.post("/api/admin/ads_list",B.c).then(function(e){o.setState({adsData:e.data.data,loader:!1,editData:""}),o.getVenueList()}).catch(function(e){o.setState({loader:!1}),console.log("axios bookslot error adasd",e)})})}),$(F(F(o)),"deleteAd",function(e,t,n){B.d.delete("/api/admin/delete_ad/"+t,B.c).then(function(t){o.handleCloseSlide(t,e)}).catch(function(e){console.log("AXIOS ERROR: ",e.response)})}),$(F(F(o)),"disableAd",function(e,t){var n="Disable Ad"!==e,a=t;a.status=n,B.d.post("/api/admin/edit_ad/"+t._id,a,B.c).then(function(t){"failed"==t.data.status?o.setState({positionerror:t.data.message}):o.handleCloseSlide(t,e)}).catch(function(e){console.log("AXIOS ERROR: ",e.response)})}),o}var o,n,a;return function(e,t){if("function"!==typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&V(e,t)}(t,i.a.Component),o=t,(n=[{key:"componentDidMount",value:function(){this.getAdsList()}},{key:"render",value:function(){var e=this,t=this.props.classes,o=s.a.name+" - Ads",n=s.a.desc,a=this.state;a.mainValue,a.valueDialog;return H("div",{},void 0,H(r.Helmet,{},void 0,H("title",{},void 0,o),H("meta",{name:"description",content:n}),H("meta",{property:"og:title",content:o}),H("meta",{property:"og:description",content:n}),H("meta",{property:"twitter:title",content:o}),H("meta",{property:"twitter:description",content:n})),H(M.g,{desc:" "},void 0,U,H(I.a,{loadit:this.state.loader?"":this.state.loader}),H(y.a,{style:{position:"absolute",zIndex:1,right:56,top:242,backgroundColor:"#0956e6"},variant:"contained",color:"secondary",onClick:this.handleClickOpen("paper")},void 0,"+ Ads"),H("div",{style:{display:"flex",width:"100%",flexDirection:"column",padding:"0px 0px 0px 0px"}},void 0,H("div",{style:{width:"100%",display:"flex",justifyContent:"center",alignItems:"center",marginBottom:"30px",fontWeight:"600",color:"#6d6d6d",fontSize:"16px",letterSpacing:"0.67px",lineHeight:"22px"}}),H("div",{className:t.root},void 0,H(c.a,{value:this.state.value,onChange:this.handleChange,classes:{root:t.tabsRoot,indicator:t.tabsIndicator}},void 0,H(u.a,{disableRipple:!0,classes:{root:t.tabRoot1,selected:t.tabSelected},label:"VENUE",style:{borderBottomLeftRadius:0}}),H(u.a,{disableRipple:!0,classes:{root:t.tabRoot1,selected:t.tabSelected},label:"EVENT"})),0==this.state.value&&H(E,{adsData:this.state.venue,onChange:this.onChange}),1===this.state.value&&H(E,{adsData:this.state.event,onChange:this.onChange})))),H(T.a,{onChange:function(t,o){e.setState($({},o,t),function(){})},open:this.state.openSlide,data:this.state.option,deleteObject:this.deleteAd,disableObject:this.disableAd,handleClickOpenSlide:this.handleClickOpenSlide,handleCloseSlide:this.handleCloseSlide,positionerror:this.state.positionerror}),H(L.a,{type:"adManager",open:this.state.open,scroll:this.state.scroll,handleClose:this.handleClose,handleClickOpen:this.handleClickOpen,data:this.state.editData}))}}])&&Y(o.prototype,n),a&&Y(o,a),t}();t.default=Object(b.withStyles)(function(e){return{container:{display:"flex"},textField:{marginLeft:e.spacing.unit,marginRight:e.spacing.unit},button:{margin:e.spacing.unit},root:{flexGrow:1},tabsRoot:{flex:1,maxWidth:"500px",borderRadius:"0"},tabRoot1:{borderBottomLeftRadius:"-13px",borderTopLeftRadius:"7px",borderTopRightRadius:"7px",backgroundColor:"#fff",display:"flex",flex:1,marginRight:"13px",marginLeft:"2px"},tabsIndicator:{borderBottomRightRadius:"0",backgroundColor:"transparent",color:"rgba(0, 0, 0, 0.87)",fontSize:"13px",fontFamily:["Roboto","Helvetica","Arial","sans-serif"]},tabRoot:{borderBottomRightRadius:"0",textTransform:"initial",minWidth:72,fontWeight:e.typography.fontWeightRegular,marginRight:4*e.spacing.unit,fontFamily:["-apple-system","BlinkMacSystemFont",'"Segoe UI"',"Roboto",'"Helvetica Neue"',"Arial","sans-serif",'"Apple Color Emoji"','"Segoe UI Emoji"','"Segoe UI Symbol"'].join(","),"&:hover":{color:"#40a9ff",opacity:1},"&$tabSelected":{color:"#1890ff",fontWeight:e.typography.fontWeightMedium},"&:focus":{color:"#40a9ff"}},tabSelected:{borderBottom:"#03A9F4"}}})(z)}}]);