import React, {PureComponent} from 'react'

export class SwapArrows extends PureComponent {
  render() {
    return (
      <svg fill="#4B4B4B" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
        <defs>
          <path d="M0 0h24v24H0V0z" id="a"/>
        </defs>
        <clipPath id="b">
          <use overflow="visible" xlinkHref="#a"/>
        </clipPath>
        <path clipPath="url(#b)" d="M9.01 14H2v2h7.01v3L13 15l-3.99-4v3zm5.98-1v-3H22V8h-7.01V5L11 9l3.99 4z"/>
      </svg>
    )
  }
}

export class Arrow extends PureComponent {
  render() {
    return (
      <svg width='11' height='8' viewBox='0 0 11 8' xmlns='http://www.w3.org/2000/svg'
           xmlnsXlink='http://www.w3.org/1999/xlink'>
        <defs>
          <polygon id='path-1' points='0 0 24 0 24 24 0 24' />
        </defs>
        <g id='Page-1' fill='none' fillRule='evenodd'>
          <g id='wrap' transform='translate(-332 -292)'>
            <g id='offer' transform='translate(92 86)'>
              <g id='Group-11' transform='translate(30 186)'>
                <g id='ic_compare_arrows_black_24px' transform='translate(203 12)'>
                  <mask id='mask-2' fill='#fff'>
                    <use xlinkHref='#path-1' />
                  </mask>
                  <polygon id='Path' fill='#E6E6E6' mask='url(#mask-2)' points='14.01 11 7 11 7 13 14.01 13 14.01 16 18 12 14.01 8'
                  />
                </g>
              </g>
            </g>
          </g>
        </g>
      </svg>
    )
  }
}

export class Alert extends PureComponent {
  render() {
    return (
      <svg fill="#8B8B8C" height="20px" width="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
      </svg>
    )
  }
}

export class Attention extends PureComponent {
  render() {
    return (
      <svg width='18' height='18' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'
           style={{backgroundColor: '#fff'}}>
        <g id='Page-1-Copy' fill='none' fillRule='evenodd'>
          <g id='oasis-direct-finalize-copy-2'>
            <polygon id='Shape' points='-1 -1 21 -1 21 21 -1 21' />
            <path d='M10,0.833333333 C4.94,0.833333333 0.833333333,4.94 0.833333333,10 C0.833333333,15.06 4.94,19.1666667 10,19.1666667 C15.06,19.1666667 19.1666667,15.06 19.1666667,10 C19.1666667,4.94 15.06,0.833333333 10,0.833333333 Z'
                  id='Shape' stroke='#9C9C9D' fillRule='nonzero' />
            <polygon id='Path' fill='#9C9C9D' points='10.9166667 14.5833333 9.08333333 14.5833333 9.08333333 9.08333333 10.9166667 9.08333333'
            />
            <polygon id='Path' fill='#9C9C9D' points='10.9166667 7.25 9.08333333 7.25 9.08333333 5.41666667 10.9166667 5.41666667'
            />
          </g>
        </g>
      </svg>
    )
  }
}

export class QuestionMark extends PureComponent {
  render() {
    return (
      <svg width='18' height='18' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'
           style={{backgroundColor: '#fff'}}>
        <g id='Page-1-Copy' fill='none' fillRule='evenodd'>
          <g id='oasis-direct-finalize-copy-3'>
            <polygon id='Shape' points='-1 -1 21 -1 21 21 -1 21' />
            <path d='M10,0.833333333 C4.94,0.833333333 0.833333333,4.94 0.833333333,10 C0.833333333,15.06 4.94,19.1666667 10,19.1666667 C15.06,19.1666667 19.1666667,15.06 19.1666667,10 C19.1666667,4.94 15.06,0.833333333 10,0.833333333 Z'
                  id='Shape' stroke='#9C9C9D' fill='#FFF' fillRule='nonzero' />
            <path d='M10.75,15 L9.25,15 L9.25,13.5714286 L10.75,13.5714286 L10.75,15 Z M12.3025,9.46428571 L11.6275,10.1214286 C11.0875,10.6428571 10.75,11.0714286 10.75,12.1428571 L9.25,12.1428571 L9.25,11.7857143 C9.25,11 9.5875,10.2857143 10.1275,9.76428571 L11.0575,8.86428571 C11.335,8.60714286 11.5,8.25 11.5,7.85714286 C11.5,7.07142857 10.825,6.42857143 10,6.42857143 C9.175,6.42857143 8.5,7.07142857 8.5,7.85714286 L7,7.85714286 C7,6.27857143 8.3425,5 10,5 C11.6575,5 13,6.27857143 13,7.85714286 C13,8.48571429 12.73,9.05714286 12.3025,9.46428571 Z'
                  id='Combined-Shape' fill='#9C9C9D' />
          </g>
        </g>
      </svg>
    )
  }
}

export class Done extends PureComponent {
  render() {
    return (
      <svg fill="white" height="10" viewBox="0 0 24 24" width="10" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 0h24v24H0z" fill="none"/>
        <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
      </svg>
    )
  }
}

export class Finalized extends PureComponent {
  render() {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"
           style={{backgroundColor: "#fff"}}>
        <g id="desktop" fill="none" fillRule="evenodd">
          <g id="icon-green-tick">
            <g id="Group">
              <circle id="Oval" fill="#66BB6A" cx="9" cy="9" r="9" />
              <polygon id="Path" fill="#FFF" points="7.47 12.6 4.5 9.66666667 5.76 8.42222222 7.47 10.1111111 12.24 5.4 13.5 6.64444444"
              />
            </g>
          </g>
        </g>
      </svg>
    )
  }
}

export class Ether extends PureComponent {
    render() {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="38" viewBox="0 0 28 28" className="ether">
                <path
                    d="M13.9596542,0 C21.6693052,0 27.9193084,6.26813493 27.9193084,14 C27.9193084,21.7321121 21.6693052,28 13.9596542,28 C6.24987994,28 0,21.7321121 0,14 C0,6.26813493 6.24987994,0 13.9596542,0 Z M13.9584514,21.6363636 L18.4013623,15.2727273 L13.9584514,17.9395337 L9.51794603,15.2727273 L13.9584514,21.6363636 Z M13.9596542,16.5454545 L18.4013623,13.8713179 L13.9596542,6.36363636 L9.51794603,13.8713179 L13.9596542,16.5454545 Z"/>
            </svg>
        )
    }
}

export class MKR extends PureComponent {
    render() {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="38" viewBox="0 0 28 28" className="maker">
                <path
                    d="M14,0 C21.7319333,0 28,6.26813493 28,14 C28,21.7321121 21.7319333,28 14,28 C6.26794317,28 0,21.7321121 0,14 C0,6.26813493 6.26794317,0 14,0 Z M15.6337184,14.0035306 L20.6353709,10.2984241 L20.6353709,18.4435119 C20.6353709,18.4435119 20.6353709,18.9122902 21.1121208,18.9122902 C21.5888706,18.9122902 21.5887602,18.4435119 21.5887602,18.4435119 L21.5887602,9.38664753 C21.5887602,9.38664753 21.5041322,8.77833013 20.7728927,8.98558584 C20.7728927,8.98558584 14.8119007,13.3876474 14.8119007,13.3876474 C14.8119007,13.3876474 14.6924011,13.5634173 14.6803311,13.7889513 L14.6803311,18.4435119 C14.6803311,18.4435119 14.6803311,18.9122902 15.1570248,18.9122902 C15.6337184,18.9122902 15.6337184,18.4435119 15.6337184,18.4435119 L15.6337184,14.0035306 Z M12.3709101,14.0035306 L12.3709101,18.4435119 C12.3709101,18.4435119 12.3709101,18.9122902 12.8476038,18.9122902 C13.3242974,18.9122902 13.3242974,18.4435119 13.3242974,18.4435119 L13.3242974,13.7889513 C13.3122275,13.5634173 13.1927278,13.3876474 13.1927278,13.3876474 C13.1927278,13.3876474 7.23173586,8.98558584 7.23173586,8.98558584 C6.50049635,8.77833013 6.41586833,9.38664753 6.41586833,9.38664753 L6.41586833,18.4435119 C6.41586833,18.4435119 6.41575798,18.9122902 6.89250781,18.9122902 C7.36925765,18.9122902 7.36925765,18.4435119 7.36925765,18.4435119 L7.36925765,10.2984241 L12.3709101,14.0035306 Z"/>
            </svg>
        )
    }
}

export class DAI extends PureComponent {
    render() {
        return (
            <svg width="100%" height="38" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg"
                 xmlnsXlink="http://www.w3.org/1999/xlink" className="dai">
                <path
                    d="M11,0 C4.92380952,0 0,4.92380952 0,11 C0,17.0761905 4.92380952,22 11,22 C17.0761905,22 22,17.0761905 22,11 C22,4.92380952 17.0761905,0 11,0 Z"
                    id="Shape" fill="#F7A600"></path>
                <g id="icon" transform="translate(5.000000, 5.000000)" fill="#FFFFFF" fillRule="nonzero">
                    <path
                        d="M5.96321084,0.0298930257 L11.9716628,6.03834499 L6.03034642,11.9796614 L0.021894453,5.97120941 L5.96321084,0.0298930257 Z M7.70388864,6.0143682 L10.2645533,6.02875439 L5.97280189,1.73700299 L1.72900447,5.98080041 L4.28966911,5.9951866 L5.98718808,4.29766764 L7.70388864,6.0143682 Z"
                        id="Combined-Shape"></path>
                </g>
            </svg>
        )
    }
}
