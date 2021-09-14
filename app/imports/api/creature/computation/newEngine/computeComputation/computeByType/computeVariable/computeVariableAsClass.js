export default function computeVariableAsAttribute(node, prop){
  let classLevelAgg = node.data.classLevelAggregator;
  if (!classLevelAgg) return;
  prop.level = classLevelAgg.level;
  classLevelAgg.levelsFilled.forEach((filled, index) => {
    if (!filled){
      if (!prop.missingLevels) prop.missingLevels = [];
      prop.missingLevels.push(index);
    }
  });
  prop.missingLevels?.sort((a, b) => a - b);
}
