'use strict';

var Sequelize = require('sequelize');

//var User = require('./models/user')(db);
var Sock = require('./sock');
//var Review = require('./models/review')(db)
//var Order = require('./models/order')(db)
//var OrderDetail = require('./models/orderDetail')(db)

module.exports = function (db) {
    return db.define('order_detail', {
            quantity: {
                type: Sequelize.INTEGER
            }
        },{
            hooks: {
                afterCreate: function (orderDet) {
                    console.log("here is the this:", this);
                    console.log("here is the ordeDet:", orderDet);
                    this.findAll({where:{sockId: orderDet.sockIf}})
                        .then(function(res){
                            if (res)
                                console.log("HERERERER", res);
                            else consloe.log("lelelele")
                        })
                    //Sock.update({},{
                    //    where: {
                    //        id: orderDet.sockId
                    //    }
                    //})
                }
            }
        }
    )
}
