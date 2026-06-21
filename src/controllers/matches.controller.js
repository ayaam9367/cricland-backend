const { socketHandler } = require("../socketHandler");
const matchService = require("../services/matchService");
const { server } = require("../server");
const Joi = require("joi");

const handleError = (res, error, activity) => {
  console.error(`${activity} Error:`, error.message || error);
  return res.status(500 || error.code).send({
    status: false,
    message: error.message || "Internal Server Error",
  });
};

exports.todayMatch = async (req, res) => {
  let activity = "Get All Today match |";
  const {page = 1 , limit=10 , pagination=false, search=''} = req?.query || {}
  try {
    const {error , value} = Joi.object({
      pagination:Joi.boolean().truthy('true').falsy("false").default(false),
      page:Joi.number().integer().min(1).when('pagination' , {is:true , then:Joi.required()}),
      limit:Joi.number().integer().min(1).when('pagination' , {is:true , then:Joi.required()}),
      search:Joi.string().allow('').optional()
    }).unknown().validate(req?.query)

    if(error){
      console.log(`Error While ${activity}` , error?.message)
      return res.status(400).send({
        status:false,
        message:error?.message,
        data:null
      })
    }
    const {
      status,
      code = 200,
      data,
      message,
    } = await matchService.getAlltodaymatch(activity , {...value , search});
    res.status(code).send({
      status,
      data,
      ...(message && { message }),
    });
  } catch (error) {
    return handleError(res, error, activity);
  }
};

exports.handleWebsocketreq = async (req, res) => {
  let activity = `Get Match Info |`;
  const matchId = req.params.matchId;
  try {
    if(!matchId){
      return res.status(400).send({
        status:false,
        message: "Match ID is required",
      })
    }
    const {
      status,
      code = 200,
      data,
      message,
      isLive,
    } = await matchService.getMatchInfo(activity, matchId);

    return res.status(code).send({
      status,
      ...(data && { data }),
      ...(message && { message }),
      isLive,
    });
  } catch (error) {
    return handleError(res, error, activity);
  }
};

exports.Currentseries = async (req, res) => {
  const activity = "Fetch Live Series";

  try {
    const {
      status,
      code = 200,
      data,
      message,
    } = await matchService.Currentliveseries(activity);

    res.status(code).send({
      status,
      ...(data && { data }),
      ...(message && { message }),
    });
  } catch (error) {
    return handleError(res, error, activity);
  }
};

exports.SeriesAllMatch = async (req, res) => {
  const activity = "Fetch Live Series Matches";
  const cid = req?.params?.cid;
  const { page = 1, limit = 10, pagination = false , name='' } = req?.query || {};
  try {
    const { error:queryError, value } = Joi.object({
      pagination: Joi.boolean()
        .truthy("true")
        .falsy("false")
        .default(false),
      page: Joi.number()
        .integer()
        .min(1)
        .when("pagination", { is: true, then: Joi.required() }),
      limit: Joi.number()
        .integer()
        .min(1)
        .when("pagination", { is: true, then: Joi.required() }),
    name: Joi.string().allow('').optional(),})
      .unknown()
      .validate(req?.query);
      
    const { error:paramError} = Joi.object({
      cid: Joi.number().integer().required(),
    }).validate(req?.params);

    if (paramError || queryError) {
      console.log(`Error While ${activity}`, error?.message);
      return res.status(400).send({
        status: false,
        message: error?.message,
        data: null,
      });
    }
    const { status, code, data, message } =
      await matchService.SeriesAllMatch(activity, cid , value);

    res.status(code || 200).json({
      status,
      ...(data && { data }),
      ...(message && { message }),
    });
  } catch (error) {
    return handleError(res, error, activity);
  }
};

exports.UpdateCurrentSeriesMatch = async (req, res) => {
  const activity = "Update Current Series Match";
  const matchId = req?.params?.id;  
  let { cid, updatedUrls , isfeatured } = req?.body || {}; 

  try {
   
    const { error: paramError, value: paramValue } = Joi.object({
      id: Joi.number().integer().required(),
    }).validate(req.params);

    const { error: bodyError, value: bodyValue } = Joi.object({
      isfeatured: Joi.boolean().required(),
      cid: Joi.number().integer().required(),
      updatedUrls: Joi.object({
        matchId: Joi.string().required(),
        matchName: Joi.string().required(),
        matchStartDate: Joi.optional(),
        status: Joi.string().required(),
        urls: Joi.object().pattern(
          Joi.string(), 
          Joi.array().items(Joi.string()) 
        ).required(),
      }).required(),
    }).validate(req.body);
    
    

    if (paramError || bodyError) {
      console.log(`Error While ${activity}`, paramError?.message || bodyError?.message);
      return res.status(400).send({
        status: false,
        message: paramError?.message || bodyError?.message,
        data: null,
      });
    }

   cid = Number(cid);
    const { status, code, data, message } =
      await matchService.UpdateCurrentSeriesMatch(activity, cid, matchId, updatedUrls , isfeatured);

 
    res.status(code || 200).json({
      status,
      ...(data && { data }),
      ...(message && { message }),
    });
  } catch (error) {
  
    return handleError(res, error, activity);
  }
};

exports.getAllSeries= async (req, res) => {
  const activity = "Get All Series Match";
  const { page = 1, limit = 10, pagination = false , status ='' , name='' } = req?.query || {};
  try {
    const { error, value } = Joi.object({
      pagination: Joi.boolean()
        .truthy("true")
        .falsy("false")
        .default(false),
      page: Joi.number()
        .integer()
        .min(1)
        .when("pagination", { is: true, then: Joi.required() }),
      limit: Joi.number()
        .integer()
        .min(1)
        .when("pagination", { is: true, then: Joi.required() }),
    status: Joi.string().allow('').optional(),
    name: Joi.string().allow('').optional(),})
      .unknown()
      .validate(req?.query);

    if (error) {
      console.log(`Error While ${activity}`, error?.message);
      return res.status(400).send({
        status: false,
        message: error?.message,
        data: null,
      });
    }
    const { status, code = 200, data, message } =
      await matchService.getAllSeries(activity, value);
    res.status(code).send({
      status,
      ...(data && { data }),
      ...(message && { message }),
    });
  } catch (error) {
    return handleError(res, error, activity);
  }
};

exports.UpdateSeries = async (req, res) => {
  const activity = "Update All Series Match";
  let id = req?.params?.id;  
  let { isfeatured , imageUrl } = req?.body || {}; 
  try {
    const { error: paramError, value: paramValue } = Joi.object({
      id: Joi.number().integer().required(),
    }).validate(req.params);

    const { error: bodyError, value: bodyValue } = Joi.object({
      isfeatured: Joi.boolean().optional(),
      imageUrl:Joi.string().optional()
    }).validate(req.body);

    if (paramError || bodyError) {
      console.log(`Error While ${activity}`, paramError?.message || bodyError?.message);
      return res.status(400).send({
        status: false,
        message: paramError?.message || bodyError?.message,
        data: null,
      });
    }

     id = Number(id);
    const { status, code, data, message } =
      await matchService.UpdateSeries(activity, id,bodyValue.isfeatured , imageUrl);

 
    res.status(code || 200).json({
      status,
      ...(data && { data }),
      ...(message && { message }),
    });
  } catch (error) {
  
    return handleError(res, error, activity);
  }
}