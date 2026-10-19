import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";

export const RouterLinkStub = defineComponent({
  props: { to: { type: String, required: true } },
  template: `<a :href="'#' + to"><slot /></a>`
});

export function mountPage(component, props) {
  const { attachTo, ...rest } = props;
  return mount(component, {
    props: rest.props ?? rest,
    attachTo,
    global: { components: { RouterLink: RouterLinkStub } }
  });
}
