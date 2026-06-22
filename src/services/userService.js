const userModel = require("../Models/userModel");
const { hashpassword } = require("../utility/helper/helper");

exports.getalluser = async (
  activity,
  { page, limit, pagination, search = "" }
) => {
  let filterquery = { isDeleted: false };
  if (search) {
    filterquery = {
      ...filterquery,
      $or: [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    };
  }
  const userpipline = [{ $match: filterquery }, { $sort: { _id: -1 } }];
  if (pagination) {
    userpipline.push({ $skip: (page - 1) * limit }, { $limit: limit });
  }
  const [users, totaluser] = await Promise.all([
    userModel.aggregate(userpipline),
    userModel.countDocuments({ isDeleted: false }),
  ]);
  return {
    status: true,
    code: 200,
    message: "all user",
    data: {
      users,
      page,
      totalUsers: totaluser,
      totalPages: Math.ceil(totaluser / limit),
      limit,
    },
  };
};

exports.createuser = async (activity, data) => {
  const { email, password } = data || {};

  const [existingUser, hashpw] = await Promise.all([
    userModel.findOne({
      isDeleted: false,
      email,
    }),
    hashpassword(password),
  ]);

  console.log("Existing User:", existingUser);
  if (existingUser) {
    return {
      status: false,
      code: 400,
      message: "User already exist",
    };
  }
  data.password = hashpw;
  const user = await userModel.create(data);

  return {
    status: false,
    code: 201,
    message: "User Created Successfully",
    data: user,
  };
};

exports.deleteuser = async (activity, userId) => {
  const userdata = await userModel.findByIdAndUpdate(
    { _id: userId },
    { $set: { isDeleted: true } },
    { new: true }
  );
  if (userdata) {
    return {
      status: false,
      code: 404,
      message: "User not found",
    };
  }

  return {
    status: true,
    code: 202,
    message: "User updated",
  };
};
//done