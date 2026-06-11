const { required, bool } = require("joi");
const { Schema, model, VirtualType } = require("mongoose");
const { trim } = require("validator");

const UserModel = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    phone: { type: Number, required: true },
    terms: { type: Boolean, required: true, default: false },
    isDeleted:{type:Boolean,default:false,required:true},
    sourceUrl: { type: String, required: true },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

// UserModel.index({ email: 1 });

module.exports = model("USERMODEL", UserModel);
