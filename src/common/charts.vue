<template>
  <div class="main-echarts">
    <img
      :src="chartUrl"
      style="width:100%;height:100%;object-fit:contain;"
    />
  </div>
</template>

<script>
export default {
  name: "charts",
  props: {
    darkMode: {
      type: Boolean,
      default: false,
    },
    fund: {
      type: Object,
      required: true,
    },
  },
  computed: {
    chartUrl() {
      return `https://j4.dfcfw.com/charts/pic6/${this.fund.fundcode}.png?v=${Date.now()}`;
    },
  },
};
</script>

<style lang="scss" scoped>
.main-echarts {
  width: 100%;
  height: 260px;
}
</style>
