<template>
  <div class="not-fond">
    <PageTitle
      page-title="Not Fond"
      :has-back="true"
    />
    <div class="content">
      <img src="~assets/img/not-fond.jpeg" />
      <p>The page is lost</p>
    </div>
  </div>
</template>
<script>
import { Component, Vue } from "vue-property-decorator";
import PageTitle from "components/page-title.vue";

@Component({
  components: {
    PageTitle
  }
})
export default class NotFond extends Vue {

}
</script>
<style lang="scss" scoped>
.not-fond {
  .content{
    img{
      margin: 0 auto;
      width: 70%;
      min-width: 300px;
    }
    p{
      margin: 20px;
      text-align: center;
    }
  }
}
</style>
