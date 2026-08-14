import stylistic from "@stylistic/eslint-plugin";
import tailwind from "eslint-plugin-tailwindcss";
import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt(
  tailwind.configs.recommended,
  stylistic.configs.customize({
    semi: true,
    quotes: "double",
    indent: 2,
    jsx: false,
  }),
  {
    files: ["**/*.{js,mjs,ts,vue}"],
    plugins: {
      tailwindcss: tailwind,
    },
    settings: {
      tailwindcss: {
        cssConfigPath: "app/assets/css/main.css",
      },
    },
    rules: {
      "vue/block-order": ["error", { order: ["template", "script", "style"] }],
      "tailwindcss/classnames-order": "error",
      "tailwindcss/no-custom-classname": "off",
    },
  },
);
