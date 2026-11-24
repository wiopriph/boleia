<script setup lang="ts">
// Local Angolan number: "+244" is fixed next to the field, the digits are grouped by three as they are
// typed. A pasted number with the country code is reduced to the same 9 digits.
const model = defineModel<string>({ default: '' });
const attrs = useAttrs();

const display = computed(() => groupPhoneDigits(localPhoneDigits(model.value)));

function digitCount(value: string): number {
  return value.replace(/\D/g, '').length;
}

// Position in the grouped text right after the given number of digits.
function caretAfter(digits: number): number {
  return digits + Math.floor(Math.max(digits - 1, 0) / 3);
}

function onInput(event: Event) {
  const input = event.target as HTMLInputElement;
  const raw = input.value;
  const caret = input.selectionStart ?? raw.length;
  const prefixLength = countryPrefixLength(raw.replace(/\D/g, ''));
  const previous = localPhoneDigits(model.value);

  let digits = localPhoneDigits(raw);
  let digitsBeforeCaret = Math.min(Math.max(digitCount(raw.slice(0, caret)) - prefixLength, 0), digits.length);

  // Backspace or Delete landed on a separator: the digit next to it is the one meant
  const inputType = (event as InputEvent).inputType;

  if (digits === previous && inputType === 'deleteContentBackward' && digitsBeforeCaret > 0) {
    digits = digits.slice(0, digitsBeforeCaret - 1) + digits.slice(digitsBeforeCaret);
    digitsBeforeCaret -= 1;
  } else if (digits === previous && inputType === 'deleteContentForward' && digitsBeforeCaret < digits.length) {
    digits = digits.slice(0, digitsBeforeCaret) + digits.slice(digitsBeforeCaret + 1);
  }

  const formatted = groupPhoneDigits(digits);

  model.value = formatted;
  // written here, not left to the re-render: the caret must be placed in the final text
  input.value = formatted;

  const position = caretAfter(digitsBeforeCaret);

  input.setSelectionRange(position, position);
}
</script>

<template>
  <UInput
    :modelValue="display"
    type="tel"
    inputmode="numeric"
    placeholder="923 456 789"
    :ui="{ base: 'ps-16' }"
    @input="onInput"
  >
    <template #leading>
      <span
        class="text-muted"
        :class="attrs.size === 'xl' ? 'text-base' : ''"
      >+244</span>
    </template>
  </UInput>
</template>
