import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";

export const RouterLinkStub = defineComponent({
  props: { to: { type: String, required: true } },
  template: `<a :href="'#' + to"><slot /></a>`
});

export function mountPage(component, props) {
  return mount(component, { props: props.props ?? props, global: { components: { RouterLink: RouterLinkStub } } });
}
