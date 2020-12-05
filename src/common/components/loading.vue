<template>
  <div class="loading-wrap p_t20 flex-row-center">
    Loading<div class="m_l8 dot-elastic"></div>
  </div>
</template>
<script>
import { Component, Vue} from 'vue-property-decorator'

@Component({})
export default class IconTip extends Vue{
}
</script>
<style lang="scss">
.loading-wrap{
  font-size: 16px;
  .dot-elastic {
    position: relative;
    margin-left: 13px;
    margin-top: 3px;
    width: 4px;
    height: 4px;
    border-radius: 3px;
    background-color: $textColor;
    color: $textColor;
    animation: dot-elastic 1s infinite linear;
  }

  .dot-elastic::before, .dot-elastic::after {
    content: '';
    display: inline-block;
    position: absolute;
    top: 0;
  }

  .dot-elastic::before {
    left: -8px;
    width: 4px;
    height: 4px;
    border-radius: 3px;
    background-color: $textColor;
    color: $textColor;
    animation: dot-elastic-before 1s infinite linear;
  }

  .dot-elastic::after {
    left: 8px;
    width: 4px;
    height: 4px;
    border-radius: 3px;
    background-color: $textColor;
    color: $textColor;
    animation: dot-elastic-after 1s infinite linear;
  }

  @keyframes dot-elastic-before {
    0% {
      transform: scale(1, 1);
    }
    25% {
      transform: scale(1, 1.5);
    }
    50% {
      transform: scale(1, 0.67);
    }
    75% {
      transform: scale(1, 1);
    }
    100% {
      transform: scale(1, 1);
    }
  }

  @keyframes dot-elastic {
    0% {
      transform: scale(1, 1);
    }
    25% {
      transform: scale(1, 1);
    }
    50% {
      transform: scale(1, 1.5);
    }
    75% {
      transform: scale(1, 1);
    }
    100% {
      transform: scale(1, 1);
    }
  }

  @keyframes dot-elastic-after {
    0% {
      transform: scale(1, 1);
    }
    25% {
      transform: scale(1, 1);
    }
    50% {
      transform: scale(1, 0.67);
    }
    75% {
      transform: scale(1, 1.5);
    }
    100% {
      transform: scale(1, 1);
    }
  }
}
</style>

