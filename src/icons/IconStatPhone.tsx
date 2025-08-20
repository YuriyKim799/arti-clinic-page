import * as React from 'react';

type Props = React.SVGProps<SVGSVGElement> & {
  title?: string;
  size?: number | string;
};

export default function IconStatPhone({ title, size = 24, ...props }: Props) {
  return (
    <svg
      viewBox="0 0 440 440"
      width={size}
      height={size}
      fill="currentColor" // наследует цвет текста
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : 'presentation'}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M5,0v360h40c0,11.667,0,33.333,0,45c0.007,3.924,1.628,7.822,4.406,10.594l20,20
          c2.772,2.778,6.669,4.399,10.594,4.406h255c3.924-0.01,7.822-1.628,10.594-4.406l15-15c2.778-2.772,4.399-6.669,4.406-10.594v-20
          c-0.007-3.924-1.628-7.822-4.406-10.594l-15-15c-2.772-2.778-6.669-4.399-10.594-4.406H191.188L190,358.812V340h245V20H135v320h25
          v25c0.007,3.924,1.628,7.822,4.406,10.594l10,10c2.772,2.778,6.669,4.399,10.594,4.406h143.812l6.188,6.188v7.625l-6.188,6.188
          H86.187L75,398.812c0-9.604,0-29.208,0-38.812h40c0-120,0-240,0-360L5,0L5,0z M190,70h190v50H190V70z M190,170h50v30h-50V170z
          M260,170h50v30h-50V170z M330,170h50v30h-50V170z M190,220h50v30h-50V220z M260,220h50v30h-50V220z M330,220h50v30h-50V220z
          M190,270h50v30h-50V270z M260,270h50v30h-50V270z M330,270h50v30h-50V270z"
      />
    </svg>
  );
}
