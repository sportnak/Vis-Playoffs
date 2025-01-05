'use client'
import { defaultBaseConfig, createSystem, defineConfig, defineRecipe } from "@chakra-ui/react"

const buttonRecipe = defineRecipe({
    variants: {
        customOutline: {
            true: {
                border: "1px solid",
                background: 'pink',
            }
        }
    }
})

const config = defineConfig({
    theme: {
      recipes: {
        button: buttonRecipe
      },
      semanticTokens: {
        colors: {
          danger: { value: "{colors.red}" },
        },
      },
      keyframes: {
        spin: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },
    },
  })
  
  export default createSystem(defaultBaseConfig, config)