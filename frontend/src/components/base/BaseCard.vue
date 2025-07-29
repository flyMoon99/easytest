<template>
  <div :class="cardClasses">
    <div v-if="$slots.header || title" :class="headerClasses">
      <slot name="header">
        <h3 v-if="title" class="text-lg font-medium text-gray-900">
          {{ title }}
        </h3>
      </slot>
    </div>
    
    <div :class="contentClasses">
      <slot />
    </div>
    
    <div v-if="$slots.footer" :class="footerClasses">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title?: string
  shadow?: 'none' | 'soft' | 'medium' | 'strong'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  rounded?: boolean
  border?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  shadow: 'soft',
  padding: 'md',
  rounded: true,
  border: true
})

const cardClasses = computed(() => {
  const baseClasses = ['bg-white']
  
  // 阴影样式
  const shadowClasses = {
    none: [],
    soft: ['shadow-soft'],
    medium: ['shadow-medium'],
    strong: ['shadow-strong']
  }
  
  // 圆角样式
  const roundedClasses = props.rounded ? ['rounded-lg'] : []
  
  // 边框样式
  const borderClasses = props.border ? ['border', 'border-gray-100'] : []
  
  return [
    ...baseClasses,
    ...shadowClasses[props.shadow],
    ...roundedClasses,
    ...borderClasses
  ]
})

const headerClasses = computed(() => {
  const baseClasses = ['border-b', 'border-gray-100']
  
  const paddingClasses = {
    none: [],
    sm: ['px-4', 'py-2'],
    md: ['px-6', 'py-4'],
    lg: ['px-8', 'py-6']
  }
  
  return [
    ...baseClasses,
    ...paddingClasses[props.padding]
  ]
})

const contentClasses = computed(() => {
  const paddingClasses = {
    none: [],
    sm: ['p-4'],
    md: ['p-6'],
    lg: ['p-8']
  }
  
  return paddingClasses[props.padding]
})

const footerClasses = computed(() => {
  const baseClasses = ['border-t', 'border-gray-100', 'bg-gray-50']
  
  const paddingClasses = {
    none: [],
    sm: ['px-4', 'py-2'],
    md: ['px-6', 'py-4'],
    lg: ['px-8', 'py-6']
  }
  
  return [
    ...baseClasses,
    ...paddingClasses[props.padding]
  ]
})
</script> 