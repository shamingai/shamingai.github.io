<template>
  <header class="site-header">
    <RouterLink class="site-name" to="/">来都来了</RouterLink>
    <nav>
      <RouterLink to="/">首页</RouterLink>
      <RouterLink to="/archive">归档</RouterLink>
      <RouterLink to="/categories">分类</RouterLink>
      <RouterLink to="/tags">标签</RouterLink>
      <RouterLink to="/search">搜索</RouterLink>
      <RouterLink to="/history">历史</RouterLink>
      <RouterLink to="/about">关于</RouterLink>
    </nav>
  </header>
  <RouterView />
</template>
