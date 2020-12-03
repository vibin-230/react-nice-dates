const Access = {
    super_admin:{
        venue:['read','create','update','delete'],
        venue_manager:['read','create','update','delete'],
        venue_staff:['read','create','update','delete'],
        event:['read','create','update','delete'],
        coupon:['read','create','update','delete'],
        users:['read','create','update','delete'],
        support:['read', 'create'],
        ads:['read', 'create','update','delete'],
        booking:['read', 'create','update','delete'],
        users:['read', 'create','update','delete'],
        offers:['read', 'create','update','delete'],
  
    },
    admin:{
        venue:['read','create','update','delete'],
        venue_manager:['read','create','update','delete'],
        venue_staff:['read','create','update','delete'],
        event:['read','create','update','delete'],
        coupon:['read','create','update','delete'],
        users:['read','create','update','delete'],
        support:['read', 'create'],
        ads:['read', 'create','update','delete'],
        booking:['read', 'create','update','delete'],
        users:['read', 'create','update','delete'],
        offers:['read', 'create','update','delete'],
  
    },
    venue_manager:{
        venue:['read','create','update','delete'],
        event:['read','create','update','delete'],
        coupon:['read','create','update','delete'],
        support:['read', 'create'],
        booking:['read', 'create','update','delete'],
        users:['read', 'create','update','delete'],
        ads:['read', 'create','update','delete'],
        offers:['read', 'create','update','delete'],
    },
    venue_staff:{
        venue:['read', 'update'],
        event:['read'],
        coupon:['read'],
        booking:['read', 'create','update','delete'],
        support:['read', 'create'],
        ads:['read', 'create','update','delete'],
    },
    user:{
        venue:['read'],
        event:['read'],
        coupon:['read'],
        support:['read', 'create'],
        booking:['read', 'create','update','delete'],
        users:['read','create','update','delete'],
        ads:['read', 'create','update','delete'],
        offers:['read'],
    }
  }

const AccessControl = (api_type, action_type) => {
    return function(req,res,next){
        console.log(req.role,api_type)
        if(!Access[req.role][api_type]){
            res.status(403).send({status:"failed", message:"permission denied"})
        }else{
            if(Access[req.role][api_type].indexOf(action_type)!== -1){
                next();
            }else {
                res.status(403).send({status:"failed", message:"permission denied"})
            }
        }
    }
  }
  
module.exports = AccessControl