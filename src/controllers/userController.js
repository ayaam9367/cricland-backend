const Joi = require('joi')
const UserService = require('../services/userService')
const { isValidObjectId } = require('mongoose')

exports.getallusers = async(req ,res , next) =>{
    let activity = "Get all user |"
    const {page=1, limit=10, pagination=true , search=''} = req?.query || {}
    try {
        const {error , value} = Joi.object({
            pagination:Joi.boolean().truthy("true").falsy("false").default(true),
            page:Joi.number().integer().min(1).when("pagination" , {is:true , then:Joi.required()}),
            limit:Joi.number().integer().min(1).when("pagination" , {is:true, then:Joi.required()}),
            search: Joi.string().allow('').default(''),
        }).unknown().validate(req?.query)

        if(error){
            console.log(`Error while ${activity}` , error?.message)
            return res.status(400).send({
                message: error.details[0].message,
            })
        }
        const {code , status  , data , message , isErrorfromUser} = await UserService.getalluser(activity , {...value , search})
        return res.status(code || 200).send({
            status:true,
            ...(message && {message}),
            ...(data && {data})
        })
    } catch (error) {
        next(error)
    }
}


exports.createuser = async(req , res , next) => {
    let activity = "Create User |"

    try {
        const {error , value} = Joi.object({
            firstName:Joi.string().required(),
            lastName:Joi.string().required(),
            email:Joi.string().required(),
            password:Joi.string().required(),
            phone:Joi.number().integer().required(),
            terms:Joi.boolean().required(),
            sourceUrl:Joi.string().required(),
        }).unknown().validate(req?.body)

        if(error){
            console.log(`Error while ${activity}` , error?.message)
            return res.status(400).send({
                message: error.details[0].message
            })
        }

        const {status , code ,data , message } = await UserService.createuser(activity , value)

        return res.status(code || 200).send({
            status:true,
            ...(message && {message}),
            ...(data && {data})
        })
    } catch (error) {
//         console.error(`${activity} Error:`, error.message || error);
//   return res.status(500 || error.code).send({
//     status: false,
//     message: error.message || "Internal Server Error",
//   });
next(error)
    }
}

exports.deleteuser = async(req ,res , next) => {
    const activity = "Delete User |"
    const {userId} = req?.body || {}
    try {
        if(!userId || !isValidObjectId(userId)){
            console.log(`Error while ${activity}`)
            return res.status(400).send({
                status:false,
                message:"USER IS MUST BE A VALID OBJECT"
            })
        }

        const {code , status , data , message , isErrorfromUser} = await UserService.deleteuser(activity , userId)
        return res.status(code || 200).send({
            status:true,
            ...(message && {message}),
            ...(data && {data})
        })
    } catch (error) {
        next(error)
    }
}