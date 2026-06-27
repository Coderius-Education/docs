import type {ReactNode} from 'react';
import {jsLessons} from '@site/src/data/jsLessons';

/**
 * Overzichtstabel van de JavaScript-lessen voor de /js-pagina. De lessen en hun
 * volgorde komen uit de sidebar (zie src/data/jsLessons.ts), zodat de tabel niet
 * kan verouderen. Globaal geregistreerd, dus bruikbaar als `<JsLessen />`.
 */
export default function JsLessen(): ReactNode {
  return (
    <table>
      <thead>
        <tr>
          <th>Les</th>
          <th>Onderwerp</th>
        </tr>
      </thead>
      <tbody>
        {jsLessons.map((les, i) => (
          <tr key={les.to}>
            <td>{i + 1}</td>
            <td>
              <a href={les.to}>{les.label}</a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
