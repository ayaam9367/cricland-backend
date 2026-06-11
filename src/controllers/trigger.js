
const Joi = require("joi");
const matchService = require("../services/trigger");

const handleError = (res, error, activity) => {
    console.error(`${activity} Error:`, error.message || error);
    return res.status(500 || error.code).send({
      status: false,
      message: error.message || "Internal Server Error",
    });
  };

exports.refreshSeriesMatch = async (req, res) => {
    const activity = "Refresh Series Match";
    const { id: cid } = req.params;
    try {
        const {error , value} = Joi.object({
            id: Joi.string().required()
        }).validate({id: cid});
        if (error) {
            return res.status(400).send({
                status: false,
                message: error.message
            })
        }

        const { status, code = 200, data, message } = await matchService.refreshSeriesMatch(activity , cid);
        res.status(code).send({
        status,
        ...(data && { data }),
        ...(message && { message }),
        });
    } catch (error) {
        return handleError(res, error, activity);
    }
    }

exports.refreshAllSeriesMatch = async (req, res) => {
    const activity = "Refresh All Series Match";
    try {
        const { status, code = 200, data, message } = await matchService.refreshAllSeriesMatch(activity);
        res.status(code).send({
        status,
        ...(data && { data }),
        ...(message && { message }),
        });
    } catch (error) {
        return handleError(res, error, activity);
    }
}