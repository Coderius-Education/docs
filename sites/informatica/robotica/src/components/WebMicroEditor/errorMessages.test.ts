import { describe, expect, it } from 'vitest';
import { friendlyError } from './errorMessages';

// friendlyError vertaalt technische fouten naar leerlingtaal, met de rauwe
// melding altijd tussen haakjes erachter — die tweede eis is waar het om
// draait: er mag nooit debug-informatie verloren gaan.

describe('friendlyError', () => {
  it('vertaalt een read-timeout naar kabel-advies', () => {
    const melding = friendlyError(new Error('read timeout (wanted 2 bytes)'));
    expect(melding).toContain('Het board reageerde niet op tijd.');
    expect(melding).toContain('(technische info: read timeout (wanted 2 bytes))');
  });

  it('herkent beide timeout-varianten', () => {
    expect(friendlyError(new Error('read timeout (pattern not seen)'))).toContain(
      'Het board reageerde niet op tijd.',
    );
  });

  it('wijst bij not connected naar de verbind-knop', () => {
    expect(friendlyError(new Error('not connected'))).toContain("'Verbind met board'");
  });

  it('matcht not connected alleen als volledige melding', () => {
    // "not connected" ergens middenin een andere fout mag niet die tekst geven
    expect(friendlyError(new Error('device was not connected properly'))).toContain(
      'Er ging iets onverwachts mis.',
    );
  });

  it('herkent library-downloadfouten met wisselende bestandsnamen', () => {
    expect(
      friendlyError(new Error('Kon leaphymicropython/x.py niet ophalen (HTTP 404).')),
    ).toContain('Controleer je internetverbinding');
  });

  it('valt terug op een algemene melding met de rauwe fout erbij', () => {
    const melding = friendlyError(new Error('iets exotisch'));
    expect(melding).toBe('Er ging iets onverwachts mis. (technische info: iets exotisch)');
  });

  it('kan ook met niet-Error-waarden overweg', () => {
    expect(friendlyError('kapot')).toContain('(technische info: kapot)');
  });
});
