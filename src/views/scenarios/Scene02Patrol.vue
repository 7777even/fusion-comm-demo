<script setup lang="ts">
import ScenarioShell from "@/components/scenario/ScenarioShell.vue"
import { SCENE_BY_PATH } from "@/scenes/meta"
const meta = SCENE_BY_PATH["/scene/02-patrol"]
</script>

<template>
  <ScenarioShell :meta="meta" />
</template>
