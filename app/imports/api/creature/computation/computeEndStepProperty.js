import evaluateCalculation from '/imports/api/creature/computation/evaluateCalculation.js';

export default function computeEndStepProperty(prop, memo){
  switch (prop.type){
    case 'action':
    case 'spell':
      computeAction(prop, memo);
      break;
    case 'attack':
      computeAction(prop, memo);
      computeAttack(prop, memo);
      break;
    case 'savingThrow':
      computeSavingThrow(prop, memo);
      break;
    case 'spellList':
      computeSpellList(prop, memo);
      break;
  }
}

function computeAction(prop, memo){
  // Uses
  let {value, errors} = evaluateCalculation(prop.uses, memo);
  prop.usesResult = value;
  if (errors.length){
    prop.usesErrors = errors;
  } else {
    delete prop.usesErrors;
  }
  prop.insufficientResources = undefined;
  if (prop.usesUsed >= prop.usesResult){
    prop.insufficientResources = true;
  }
  // Attributes consumed
  prop.resources.attributesConsumed.forEach((attConsumed, i) => {
    if (attConsumed.variableName){
      let stat = memo.statsByVariableName[attConsumed.variableName];
      prop.resources.attributesConsumed[i].statId = stat && stat._id;
      let available = stat && stat.currentValue || 0;
      prop.resources.attributesConsumed[i].available = available;
      if (available < attConsumed.quantity){
        prop.insufficientResources = true;
      }
    }
  });
  // Items consumed
  // TODO
}

function computeAttack(prop, memo){
  // Roll bonus
  let {value, errors} = evaluateCalculation(prop.rollBonus, memo);
  prop.rollBonusResult = value;
  if (errors.length){
    prop.rollBonusErrors = errors;
  } else {
    delete prop.rollBonusErrors;
  }
}

function computeSavingThrow(prop, memo){
  let {value, errors} = evaluateCalculation(prop.dc, memo);
  prop.dcResult = value;
  if (errors.length){
    prop.dcErrors = errors;
  } else {
    delete prop.dcErrors;
  }
}

function computeSpellList(prop, memo){
  let {value, errors} = evaluateCalculation(prop.maxPrepared, memo);
  prop.maxPreparedResult = value;
  if (errors.length){
    prop.maxPreparedErrors = errors;
  } else {
    delete prop.maxPreparedErrors;
  }
}