import React from 'react';
import { getLanguage } from '../../i18n/runtime';

/**
 * Liste « A, B, C » dont chaque élément est un texte à part : la traduction de l'interface traduit
 * chaque nom (pays, langue...) séparément, et le séparateur suit la langue affichée.
 */
export const JoinedList: React.FC<{ items: (string | null | undefined)[] }> = ({ items }) => {
  const language = getLanguage();
  const separator = language === 'ZH' ? '、' : language === 'AR' ? '، ' : ', ';
  return (
    <>
      {items.filter(Boolean).map((item, index) => (
        <React.Fragment key={`${item}-${index}`}>
          {index > 0 && separator}
          <span>{item}</span>
        </React.Fragment>
      ))}
    </>
  );
};
