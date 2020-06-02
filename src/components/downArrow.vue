<template>
  <svg
    class="bi bi-arrow-down"
    :width="width"
    :height="height"
    viewBox="0 0 16 16"
    :fill="iconColor"
  >
    <title :id="iconName" lang="en">{{ iconName }} icon</title>
    <path
      fill-rule="evenodd"
      d="M4.646 9.646a.5.5 0 0 1 .708 0L8 12.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z"
    />
    <path
      fill-rule="evenodd"
      d="M8 2.5a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-1 0V3a.5.5 0 0 1 .5-.5z"
    />
  </svg>
</template>
<script>
export default {
  props: {
    iconName: {
      type: String,
      default: "box"
    },
    width: {
      type: [Number, String],
      default: 18
    },
    height: {
      type: [Number, String],
      default: 18
    },
    iconColor: {
      type: String,
      default: "currentColor"
    }
  }
};
</script>
