let pending;

export function loadSite() {
  pending ??= fetch("/site-data.json").then((response) => {
    if (!response.ok) throw new Error("站点数据不存在");
    return response.json();
  });
  return pending;
}
