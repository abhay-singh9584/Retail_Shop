var express = require('express');
var router = express.Router();
var mongoose=require('mongoose')

const productSchema=mongoose.Schema({
  name:String,
  price:Number,
  dis:String,
  imgurl:String,
  like:{
    type:Array,
    default:[]
  },
  user:{type:mongoose.Schema.Types.ObjectId,ref:'users'},
  username:String
})

module.exports=mongoose.model('product',productSchema)
