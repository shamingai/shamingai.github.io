function compareTitle(left, right) {
  return left.title.localeCompare(right.title, "zh-Hans-CN");
}

function compareDate(left, right, direction) {
  const byDate = left.publishedOn.localeCompare(right.publishedOn) * direction;
  return byDate || compareTitle(left, right);
}

export function homeOrder(articles) {
  return [...articles].sort((left, right) => compareDate(left, right, -1));
}

export function archiveYearOrder(articles) {
  return [...articles].sort((left, right) => compareDate(left, right, 1));
}
