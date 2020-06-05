import SimpleSchema from 'simpl-schema';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { getUserTier } from '/imports/api/users/patreon/tiers.js';
import { assertEditPermission } from '/imports/api/creature/creaturePermissions.js';
import Creatures from '/imports/api/creature/Creatures.js';

let Experiences = new Mongo.Collection('experiences');

let ExperienceSchema = new SimpleSchema({
	name: {
		type: String,
		optional: true,
	},
	// The amount of XP this experience gives
	xp: {
		type: SimpleSchema.Integer,
		optional: true,
    min: 0,
	},
  // Setting levels instead of value grants whole levels
  levels: {
    type: SimpleSchema.Integer,
    optional: true,
    min: 0,
    index: 1,
  },
	// The real-world date that it occured, usually sorted by date
	date: {
		type: Date,
		autoValue: function() {
			// If the date isn't set, set it to now
			if (!this.isSet) {
				return new Date();
			}
		},
    index: 1,
	},
  creatureId: {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
    index: 1,
  },
});

Experiences.attachSchema(ExperienceSchema);

const insertExperienceForCreature = function({experience, creatureId, userId}){
  assertEditPermission(creatureId, userId);
  if (experience.xp){
    Creatures.update(creatureId, {$inc: {xp: experience.xp}});
  }
  if (experience.levels) {
    Creatures.update(creatureId, {$inc: {xpLevels: experience.levels}});
  }
  experience.creatureId = creatureId;
  return Experiences.insert(experience);
};

const insertExperience = new ValidatedMethod({
  name: 'Experiences.methods.insert',
  validate: new SimpleSchema({
    experience: {
      type: ExperienceSchema.omit('creatureId'),
    },
    creatureIds: {
      type: Array,
      max: 12,
    },
    'creatureIds.$': {
      type: String,
      regEx: SimpleSchema.RegEx.Id,
    },
  }).validator(),
  run({experience, creatureIds}) {
    let userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('Experiences.methods.insert.denied',
      'You need to be logged in to insert an experience');
    }
    let tier = getUserTier(this.userId);
    if (!tier.paidBenefits){
      throw new Meteor.Error('Experiences.methods.insert.denied',
      `The ${tier.name} tier does not allow you to grant experience`);
    }
    let insertedIds = [];
    creatureIds.forEach(creatureId => {
      let id = insertExperienceForCreature({experience, creatureId, userId});
      insertedIds.push(id);
    });
    return insertedIds;
  },
});

const removeExperience = new ValidatedMethod({
  name: 'Experiences.methods.remove',
  validate: new SimpleSchema({
    experienceId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id,
    },
  }).validator(),
  run({experienceId}) {
    let userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('Experiences.methods.remove.denied',
      'You need to be logged in to remove an experience');
    }
    let tier = getUserTier(this.userId);
    if (!tier.paidBenefits){
      throw new Meteor.Error('Experiences.methods.remove.denied',
      `The ${tier.name} tier does not allow you to remove  an experience`);
    }
    let experience = Experiences.findOne(experienceId);
    if (!experience) return;
    let creatureId = experience.creatureId
    assertEditPermission(creatureId, userId);
    if (experience.xp){
      Creatures.update(creatureId, {$inc: {xp: -experience.xp}});
    }
    if (experience.levels) {
      Creatures.update(creatureId, {$inc: {xpLevels: -experience.levels}});
    }
    experience.creatureId = creatureId;
    return Experiences.remove(experienceId);
  },
});

const recomputeExperiences = new ValidatedMethod({
  name: 'Experiences.methods.recompute',
  validate: new SimpleSchema({
    creatureId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id,
    },
  }).validator(),
  run({creatureId}) {
    let userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('Experiences.methods.recompute.denied',
      'You need to be logged in to recompute a creature\'s experiences');
    }
    let tier = getUserTier(this.userId);
    if (!tier.paidBenefits){
      throw new Meteor.Error('Experiences.methods.recompute.denied',
      `The ${tier.name} tier does not allow you to recompute a creature's experiences`);
    }
    assertEditPermission(creatureId, userId);

    let xp = 0;
    let xpLevels = 0;
    Experiences.find({
      creatureId
    }, {
      fields: {xp: 1, levels: 1}
    }).forEach(experience => {
      xp += experience.xp || 0;
      xpLevels += experience.levels || 0;
    });
    Creatures.update(creatureId, {$set: {xp, xpLevels}});
  },
});

export default Experiences;
export { ExperienceSchema, insertExperience, removeExperience, recomputeExperiences };
