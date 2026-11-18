<script setup lang="ts">
import ScenarioShell from "@/components/scenario/ScenarioShell.vue"
import { SCENE_BY_PATH } from "@/scenes/meta"
const meta = SCENE_BY_PATH["/scene/03-report"]
</script>

<template>
  <ScenarioShell :meta="meta" />
</template>
