import SimpleSchema from 'simpl-schema';
import VARIABLE_NAME_REGEX from '/imports/constants/VARIABLE_NAME_REGEX.js';
import STORAGE_LIMITS from '/imports/constants/STORAGE_LIMITS.js';
import createPropertySchema from '/imports/api/properties/subSchemas/createPropertySchema.js';

let ClassLevelSchema = createPropertySchema({
	name: {
		type: String,
		optional: true,
    max: STORAGE_LIMITS.name,
	},
	description: {
		type: 'inlineCalculationFieldToCompute',
		optional: true,
	},
	// The name of this class level's variable
	variableName: {
    type: String,
    min: 2,
		regEx: VARIABLE_NAME_REGEX,
    max: STORAGE_LIMITS.variableName,
  },
	level: {
    type: SimpleSchema.Integer,
		defaultValue: 1,
    max: STORAGE_LIMITS.levelMax,
  },
});

export { ClassLevelSchema };
