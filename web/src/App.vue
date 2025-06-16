<template>
  <div class="h-screen bg-stone-200 dark:bg-zinc-900 relative overflow-hidden p-2 flex flex-col">
    <div class="absolute inset-0 opacity-25">
      <svg class="w-full h-full" viewBox="0 0 1400 800" xmlns="http://www.w3.org/2000/svg">
        <g
          stroke="currentColor"
          stroke-width="0.8"
          fill="none"
          class="text-warm-gray-400 dark:text-zinc-600"
        >
          <path d="M-200,100 Q100,80 400,100 T1000,100 T1600,100">
            <animateTransform
              attributeName="transform"
              type="translateX"
              values="0; -400; 0"
              dur="20s"
              repeatCount="indefinite"
            />
          </path>
          <path d="M-200,150 Q150,170 450,150 T1050,150 T1650,150">
            <animateTransform
              attributeName="transform"
              type="translateX"
              values="0; -400; 0"
              dur="25s"
              repeatCount="indefinite"
            />
          </path>
          <path d="M-200,200 Q200,180 500,200 T1100,200 T1700,200">
            <animateTransform
              attributeName="transform"
              type="translateX"
              values="0; -400; 0"
              dur="30s"
              repeatCount="indefinite"
            />
          </path>
          <path d="M-200,300 Q250,320 550,300 T1150,300 T1750,300">
            <animateTransform
              attributeName="transform"
              type="translateX"
              values="0; -400; 0"
              dur="22s"
              repeatCount="indefinite"
            />
          </path>
          <path d="M-200,400 Q300,380 600,400 T1200,400 T1800,400">
            <animateTransform
              attributeName="transform"
              type="translateX"
              values="0; -400; 0"
              dur="28s"
              repeatCount="indefinite"
            />
          </path>
          <path d="M-200,500 Q350,520 650,500 T1250,500 T1850,500">
            <animateTransform
              attributeName="transform"
              type="translateX"
              values="0; -400; 0"
              dur="35s"
              repeatCount="indefinite"
            />
          </path>
          <path d="M-200,600 Q400,580 700,600 T1300,600 T1900,600">
            <animateTransform
              attributeName="transform"
              type="translateX"
              values="0; -400; 0"
              dur="18s"
              repeatCount="indefinite"
            />
          </path>
        </g>
      </svg>
    </div>

    <header v-if="$route.path !== '/login'" class="h-min-10 flex justify-between items-center z-10">
      <div class="flex items-center">
        <RouterLink
          to="/"
          class="flex items-center hover:opacity-80 transition-opacity duration-200"
        >
          <img src="@/assets/brand/espwol.svg" alt="" class="size-10" />
          <p
            class="text-xl font-semibold leading-[10px] ml-1 tracking-[3px] font-stretch-expanded text"
          >
            EspWOL
          </p>
        </RouterLink>

        <div class="ml-5 space-x-3 flex items-center">
          <RouterLink to="/" class="nav-pill-link">
            <div class="nav-pill" :class="{ 'nav-pill-active': $route.path === '/' }">
              {{ $t('header.home') }}
            </div>
          </RouterLink>
          <RouterLink to="/settings" class="nav-pill-link">
            <div class="nav-pill" :class="{ 'nav-pill-active': $route.path === '/settings' }">
              {{ $t('header.settings') }}
            </div>
          </RouterLink>
        </div>
      </div>

      <RouterLink to="/account" class="avatar-link">
        <AvatarRoot class="avatar-root" :class="{ 'avatar-active': $route.path === '/account' }">
          <AvatarFallback class="avatar-fallback">
            {{ shortUsername }}
          </AvatarFallback>
        </AvatarRoot>
      </RouterLink>
    </header>

    <main class="flex-1 relative z-10">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { RouterView, RouterLink } from 'vue-router'
import { AvatarFallback, AvatarRoot } from 'reka-ui'
import { ref } from 'vue'

const shortUsername = ref('ST')
</script>
