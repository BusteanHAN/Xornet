<template>
  <div class="home">
    <loadingScreen/>
  </div>
</template>

<script>
import loadingScreen from '@/components/loadingScreen';

export default {
  name: 'Home',
  components: {
    loadingScreen
  }
}
</script>
