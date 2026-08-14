export default defineAppConfig({
  ui: {
    colors: {
      primary: "green",
      neutral: "stone",
    },
    button: {
      slots: {
        base: "rounded-none font-medium shadow-none",
      },
      compoundVariants: [
        {
          color: "primary",
          variant: "solid",
          class: "bg-primary text-default shadow-none hover:bg-primary hover:brightness-95 active:bg-primary active:brightness-95",
        },
        {
          color: "neutral",
          variant: "outline",
          class: "bg-transparent text-default shadow-none ring ring-inset ring-default hover:bg-accented/40 active:bg-accented/40",
        },
      ],
    },
  },
});
