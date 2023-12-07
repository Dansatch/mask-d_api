import Joi from "joi";
import extendJoi from "joi-objectid";

export default () => {
  Joi.objectId = extendJoi(Joi);
};
