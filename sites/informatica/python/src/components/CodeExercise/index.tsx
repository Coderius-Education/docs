// De gedeelde CodeExercise (@coderius/python-runner), met de opslag van deze
// cursus: het veld bewaart de code van de leerling in zijn browser.
import CodeExercise from '@coderius/python-runner/CodeExercise';
import type { ComponentProps } from 'react';

export default function CodeExerciseVanPython(props: ComponentProps<typeof CodeExercise>) {
  return <CodeExercise {...props} site="python" />;
}
