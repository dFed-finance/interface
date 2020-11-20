<template>
  <svg class="icon-font icon" :class="`icon-${name} ${className}`" aria-hidden="true" @click="$emit('click')">
    <use :xlink:href="`#icon-${name}`" />
  </svg>
</template>
<script>
import Vue from 'vue'
export default Vue.extend({
  props: {
    name: {
      type: String,
      default: ''
    },
    className:{
      type:String,
      default:''
    }
  }
})
</script>
<style lang="scss">

</style>

