/**
 * Create a standard Kapsule configuration for common patterns
 */
export const KapsuleConfigs = {
  /**
   * ColoredText component configuration
   */
  ColoredText: {
    props: {
      color: { default: 'red' },
      text: { default: '' }
    },
    init: function (domElement, state) {
      state.elem = document.createElement('span');
      domElement.appendChild(state.elem);
    },
    update: function (state) {
      state.elem.style.color = state.color;
      state.elem.textContent = state.text;
    }
  }
};
