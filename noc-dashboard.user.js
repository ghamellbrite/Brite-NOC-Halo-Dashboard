// ==UserScript==
// @name         Brite NOC Dashboard (Hali)
// @namespace    brite-noc
// @version      2.0.0
// @description  Full-screen NOC wallboard overlay for HaloPSA dashboard 1013, styled with the Hali design language.
// @match        https://brite.halopsa.com/dashboard*
// @run-at       document-start
// @grant        none
// @noframes
// @homepageURL  https://github.com/ghamellbrite/Brite-NOC-Halo-Dashboard
// @updateURL    https://raw.githubusercontent.com/ghamellbrite/Brite-NOC-Halo-Dashboard/main/noc-dashboard.user.js
// @downloadURL  https://raw.githubusercontent.com/ghamellbrite/Brite-NOC-Halo-Dashboard/main/noc-dashboard.user.js
// ==/UserScript==

(() => {
  'use strict';

  if (new URL(location.href).searchParams.get('id') !== '1013') return;

  /* ======================================================================
   * CONFIG – everything you are likely to tweak lives here
   * ==================================================================== */
  const CONFIG = {
    dashboardId: '1013',

    // Tickets closed at or above this gets the crown
    crownAt: 12,

    // Halo report id -> what it feeds
    reports: {
      180: 'closedByAgent',
      532: 'actionableByAgent',
      164: 'priorityPie',
      123: 'feedbackPie',
      261: 'kpiOpened',
      262: 'kpiClosed',
      263: 'kpiOpen',
    },

    // SLA table widget ("Reactive Ticket SLA"): Area | Response SLA (%) | Fix SLA (%).
    // Report 662 is the best guess from the request order - press D on the dashboard to confirm.
    slaReport: 662,
    slaArea: /reactive/i,          // which row of the table to show
    slaTargetPct: 95,              // ring turns amber within 5 pts of this, red below that

    scroll: { pxPerSecond: 12, topPauseMs: 1200, bottomPauseMs: 1800, resetStepPx: 10 },
  };

  const LOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAB8CAYAAADThI02AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCA1LjEuMTITAUd0AAAAuGVYSWZJSSoACAAAAAUAGgEFAAEAAABKAAAAGwEFAAEAAABSAAAAKAEDAAEAAAACAAAAMQECABEAAABaAAAAaYcEAAEAAABsAAAAAAAAAGAAAAABAAAAYAAAAAEAAABQYWludC5ORVQgNS4xLjEyAAADAACQBwAEAAAAMDIzMAGgAwABAAAAAQAAAAWgBAABAAAAlgAAAAAAAAACAAEAAgAEAAAAUjk4AAIABwAEAAAAMDEwMAAAAADZp5qVybcLXwAAI6JJREFUeF7tnXucnVV1979rn+fMTDIzSQgJDAmBXIgW5aYCgqJGVERttS3eW3lpsV5KebV9qbRqtXjh1Spira8WtVKttqWK9yqlEVEsGIIIgqCJgXDJHWGSuZ85Z633j7NOMvPkzOWceeZ2zv5+PvuTzLPPOc9tP79n7bXXXluIRKbA5k23AaAEOmQ7x3AznWxFw+CzEP1cUkrWQ/iKil7aw7rf7Lbz6LG1lEL5+88645n4f0eh6Q3i/1r604d9MtLApO9+JJIFbcBlwIlAArwS+N30hyKRWomCFZkOOoETRvydB04d8XckUhdRsCLTQSvQntp2BJBLbYtEaiIKVmRShNoaS66KOK10IasP8xJpampog5HIpMm772oki923FYnUTRSsyHSw5PAuYeiEsGD0tgmQEeUgmiqRZiIKVmRKqJSLhVFCshho9RCEXv9ci8lhVheMpUuRSBXEbH47BkRiM58eyu+yTZs2lf/yZqJStmqCS1M5nkoJQCcPsNI20i7bXgN8CdCccZvB84Zz4eEeW/e8vXre9h7WoqIEg5xBTgPBXPgOiqBiQTnrzLPLO56lZjrR8xHb38wSLazI5BAlJ/102G4W8wCdPECnlP9tk93krIBY2TUfLBwZLCQ5Y1CMbQKIaRvQrqLk6GchO+nkARbZA3Tya9qlXNpy28mH3QQZPLTv8TUj0kREwYqMQbl7Z3Koq9fK4xwpd7DSNras0o1rVunG5Stkoyy3u2izboImYAlY8mQxENMhTPvFlETpyJkuCxTJh70s505WspEu2Zg/Ktx4/PLku11L8zfKovxNLMjfRS50lw8jilVkBFGwIuMiI7qCOfppt53LOuzBqxfK1ps6ZOt3l+iDb1lkDyxaZNtZwE5E+gNSXIIUQfQAQbebaFHQfJ6+pQvYTac9zCLdTicPHt/Jto90yLbvLwjbvtcWtl20MGwLrbKbIP2I1RxOEWlwYluITEC5iZj7lSCcClyEsBo4PSgfX2hPfGKp3PGkJblN0hp2tGgY7LJQRIM+UQy6tRR0CEja9MCypdzLMr0332b7XxI0/IdJuLQYwjqj5bRgyZ8mypIWVXKmBDs0ClgRrnSJNBfxnkfGIRDcL4Ul3ly0hKiaKCaA0ZJY/4ULZcdXF7Lz/ByDixA9UoGi0F8KdKuEAiA5Bte2267FHbbr0sQGvwh6JujBNigWikkpsVwpIWiCSmyekdGImX00vXEO8Riw28sjwD7gCWC48oE4SjOdBDb95KcetF6iU7awQm7s7JRfXQ36R2IhSKksZMUcqLAnMb0J9PnFQJcJ/wJcIcZNielxYmETFg6IhXNAFyCKhiLFAEbYr7S9NRQXXddj63W3PIs+juWsZz5j3LfqdEdijTNKmADF2P5mFrFx7sgcQYECcADYA9wP/Bi4BdgiIv3pL0QmyXjPmjFKsIKVaA+/pktupFN+tQbRr+eUU6UUFGGLhrBShc6cYoCUAqhwlQkfFtONiekpYphYKNtl6A4TrBRYpWAm4QslXfKWYmnVUK+dwGNyEgOyzAXrkCxpqlswS4J1CnA68PkoWDPLfBCsaqhbXz8F/rMiXsCIsfDJ0bQNziM1b9tcjrPCAkh5VFCsHHcVLIC2ua4pnWyjS26ik62CFP9E0Ksw7QB+joTrTXgV6FPLvxxQwuWgnwJuCOizyw78MAS6EfQuCJcULb9EJdwH4Q8HdeXPuvV0+lhNgSWUaKEYyvvG479MQDSQuH/rjLPOnpJoqdb0bQGeAlwNPAC8JYTx7L9I1szXqx2Ao4CXAJ8AbgS+ALwIaEl/ODI5EivQbrvoZBudPEiHPcQitrLYtrHYtrGQneTox+2vLwKfBoqIngx6spheDPplFR0AisF4GMIA8DCAie400XdB+BgWXgdhCYR9EP4yKYW7EgNCgZwcKI8k8ms62U6HbKeD7XTIA3Tadhaym8QGD45gzhACnANcB7xwAvs0Mk3MVwtrLH4DfAX4FPCLyfQYmtbCovzIbdp8GyqAtdBhu1jG7XTYbrAWsECOQvmzFpDQSz7sIUh/5V23UozrMH02hCFE31oKer1KuDBo8g4Ibyy/TPTvNRSfF0zfntNwBxY+BvwJhGIR+VCA94VSGDZa6MstosQC8gpYwlAuoSSBnBUPdggHrYsDehr9dHH62TNmYZ0OXAuc5H9/BnhztLBmlkYTLPzt/5A3rs8Cu9IfGEkzC1YOuOuOryJSAGuh3XZztN2eW2C7EmxBK8ZiZGABUjwSC0cRdImFwloNugwLSbDQIhbOAJ5K2YL6ZTFwYckW3lW05WerLdwK7ArSf0Yi+w7kpP+BRMOfivF+jE4IBcV+JMaDomVfpeb0QRV2J8rjWPKbQi7pNujPmR4IaEFFh/tZYd36DPpsLaee9XuHRmDqYBKClQDnA1cCJ4/YHgVrFmhEwapQcuf8u4H/GStmupkFq03g13e8kzbZK1hyYt4Gf79dHzsxZwOLIVkGLEeKbVDsKDuzNCmFEFS07KGyshUE4eAcQyX5rwFb9YZue/q+QVvh+9nJErmTBex4fqD45YAe4/6sg05t/zoaQCWUcsowMDgcQi+iAy0l3QP6eCEp7ilK20+G9aiv9dn67vVnfLDcSa2TCQRLgNcDH3MXxEiiYM0CjSxYFbYAfw5s9NHGUTSzYHUCD9/xx7TLtmON5KtinJlX9QsSynFWUkQogqkiDA6HZAjoCxRLLlh9EPaq6H4lPGIk2/ts/Vf26Asf7rM1IEo7D3J0uFna2fZ8ofjcQPH4gHaJ0a7Y0Vho9Z22GCwE2sRCK0ApuDiWyqpWTAqUAgWs5eo+ffK7jzvj2mLfFFrwOILV4j7SjwOr05VRsGaHZhAs3Lf1KeAjQM/IiqYWLIGdt19Eu2w7R4UbsNCes7K/6mBkeyj0B9NfAb8EfqG0/AoLOxDtCcZAWbA4oKFYVEKhJC306Xr26bmUBatIuzzIcrmVdraTs2GCFEKgkAdNSpY7QiUsxJK2YHpkjsJKMU7CkpOApxAKxwG5cqoaBRQLUJJwT489+YXHn3Ht3lE3tEbGEKw24BLgr4Ej05VOFKxZoFkECw95eDfwDyMtraYWLGDn5j+mXbadqHADcFwlsl1Fy4IlRZBiKRjDEIax5IlgoRe0G9glFg4AW03YVZTwREmS3YO66v5ue/qBQesiUKAl7GYJ90kbe4/N2fCaIIWjA4UlKrq+iHQpyZHBwrKcsiRHoUOMxViSB/JIUcoTsMvHJeVwBiuG8B89rLvo+DOuHcxYsFqAN7vPqiNdOYIoWLNAMwkWwH7gw8An05bWWDSyoHUCD29+C+2yLfFluF4K4RjgSINFiHYihUVIMS+mLQEkaAuiASgecjyVRwzNSIaLktxass6Lirb0oSJtBCmQo588ByTHwCuQ4icDejQUcypIQQyTck6snAZy5hOuLagJhVJgSIX9WOj1WQ57gEdMuKbP1t1/3JmfZbwuYY3N+0gXq8t80Yzx+Azw5kZuH3ORZhMsgCHgCu8eFtOVaRq5QS4Efr35fbTJ7sqm4PnY2xQWlgWreBQUFwe0K2+Dx7Zqz/K8DR4Luhx0EaIrgKUQMJLdWPJ6lXAzlj8GSn2B4n5EV7lFNoToe0AvB01UKBXEdkHYE4xedOHDJV22r8iCPcAuE3aXJOxXYa/Hc/X5/SsCNmhdrD/zCgbHacE1NO8FblVd4tdgIqJgzQLNKFh4qMPrgR+ONXpYoZEbZA64+/ZvkRtjgkA57XERlXLk+wJ2s4w7aWdHCxZaEV0upp9A9GVliyh8AEuuxMLTVMIHgfcH05sRvRK0C3gPosOgXwQ9D8JQyeRdKuGfjTA4aCsHuvV07aer3BUFSlLuClZDrY2nPfMVo+OwUndzks17CfBXwJ8dnot+TKJgzQLVW0Ljc4z7sp6RrmgmDBjkGPpYM6oMWLn06xr6bB0Duo4e1jPAsai1ARRUGFTC60x4gQEm/AD4NugViP5HMH1OMF2OaA44DrgQ+DpwnocJ7AJac8YliYYTxZI+tQ4dtBUM6Fr6bC09rKbPyv+vVgbomlLQqLMC+EcfSZ6sWEVmiWYVLDxi+Ypyd6Z5qNgrlRsfPO/UyCKUS0DLPqWR37fgPiw2qOjbVGjzqTf/Bvq3gl4mpquEYh4pHuMjbuWRvnK0+Kc8EPMLoENQXCMU358vcXS+FMgrJKrkFBIN5WOxsYqr7shSG0cDHwVeGad0zQ+aWbAAzvVYm2jXVxiREhkLowuVDKS6NKBvC+hyQFXY4V2ql4LmkPJkZUFXgLYBi0bsocP9RM8Fdnu38xyheGme3nyb7KQ17CSE/oPBqJXfq1rq57fcyn5VlUVfI3OUZhesNn/Qjk9XNCoj5Kj8ty/TdbAQMC8qgZIkGAkByKmCaAvo5WKF83x+X4DwTBU9AXQI0e+D7sMUTI8Uo32EYN0F/NwF4lnAKgBEE2TwTfmw6wXtyR0syN+J5PaioYCJHjyeaqVO1rql98oqC75G5jB13/EG4kTg4mZ8y45lnxxca1A4FP+k5X9NOBm4CCNfyZlVkiBK8jiEvwXeBLrTf301ol2g5XimsphdoKL/qsKQSghK4sKjy0X639YSdrW3yl6Qgu+/bNWNVWpEgFM908TzomU9/8hylLASJ5MVi3yoeSZ8Czs8DumOdEWzjwJtvv2nZcEy6JStdMkNL+qUrd8UY4FJoCBSVMINwfhIXnVTsGIO9DvA8yFsNtErTMK/K0k76CVI4dMqLDGS34VwuVh4cjAkZ4oR7hqWthftl3WP7eYc+jiOZ53+7DHfqmMJ7khSzXspcH1GYhVHCWeBsdpCPXzb/RJZlA3Ai4HXAO8HboMpzXGdiBXA6zK+Hg3FoYVUua8YuLUkoVCU0F0i+cwwHW/sZ9WPelk1VJS2ofIIYIJJWAJhDdAKWirRtq+fFfSyurtHjvtCP12vL7Lwh0oyNCwtvUPS8Y1BO6a74EZZ0PF7a3XcrBagKwOxiswSddzzMekBtmdUHgA2Ad8A3gv8jsdNXQ88nt5xBoi/dSeKbm46KlOhcdEyYafBGzTo67DwcqzlsoIds2cfp7M3nEa/LFOTpNtIwJJOrGWdaJIPaHGYjv3d9gz26YvYp8+zbk7+2TCLXmvCa0uSXDAgy6/6jZxS7LZTsNIS8qWQaQONzH/mQ3swn7z8TeAPgT/25HxZdWUr/BbwzPTGZqdsWZVH5Iq0MWgrrM/W7+rT9V/rs3W39Ou6gT5bTZ+tpp8VFKTdhiXZUpKAERaYaCeiBCv2Yi17Bm0FfXoCA3qCx1ut2dPDum/0sO7GXlvb22urGeQohqVtnjTPyEwy31rEIPAtt7Z+lK6cIu3Ay5rR+V6NsoudgzFZKsqgHEG3nsm+0vns1fPZq+exz55Lj56E6SKClUcViyH8phS0VMwVWjUUliODgA4Go9cIKAmibRRLXTxuZ7JXz+Ux3cABPY2iLUUJDIfAUG5yfqpI8zDfBAu3rH4OXArcnq6cIud6FHzkIOUgCBMo0cagraRP19On6+lhHX0cRz9HUWQhWIKSoCT7ykuxaStSPMfjpUoQSuUmVw6VKNoiBm0Fvbaafl3NoHWhtICveVjOx5U+nkgzMx8Fq8I9Pp3i4XTFFDjOu4ZNS8WySuNpXcrydTDsQRkOSilASZKy2FgLwcLjYgwmhuRKyRFoC0ZLcVhaS0qgJDAsCcMhEDSQWCU4tOhzCD3avuLoH6dEmotqbXM+8RPgKp/BnwULgbPSGyOHKFs+5eXAVBQL5f+XY6aUQAGhuD9QrIzqCuUgz14VBirBnhoORatXlhUbSbDy1KDKL0QiZByH9RnPJTSK6Y5TMbOlwHczdJh/y6drFJiB45/XCNy6+RZfsj6hgwc4lhvpkK3HAz8KVkkICCr6wx7Wv2y3ntfXYydgoSxUZ595NlJlBEUr79LK9Jv0ByZJqnl3AT/IyIqOcVizwHy3sAC6XWSy6iGs9XQjkYkwyBnkTBGKBIoIwwRTM0GV8hxEsUBOkx1Bw8E8NiOj1OvUokgT0giCpcB3PBNlFiyN8ViTI1DOqJAvlTOFBsBopSRtQ2ot/SYJkCDaghTbunPaUqKyuIWF8srSY+JeKnNFqzjg0yXSVIzXYuYTW4G70xvrZNE4Cw9EUoiWLahEy2mOKVtVvRB2ifocRA2KhfuCHsr64J9L/VokMj6N0mIGPBNAFuSjhTV5TAJYQk6TSp4sEO3PmV6bmO4Q0z5M70B0I1Ryt1fWMqyj+VVJeRNpHhrpjj+S3lAnOZ90HZmAcqfNlwSjEqfVRZ+tsT5bc10Pa17Sz5rzB2TNBf2yZkuvdFGirfzlKDaROmikVvNQhuENkQkpd/9UlKJAIYG+3BIet6ezR89ll2wo7ggb7nkot+HHD+c2PPpI2GCPyWkUKuMZU0u+F2lSGkmwIrPEIQtrIf2soIe19NpaemwtB2Qt3WE1+2U1vdLlcwRj6GekPuZ8HFapVEpvgiq/KyJv9sUEpsoQcAHwn1TZT61kd3nnNjrq7VdNiOp7N050/Wq8P5nHYaU31kqNx38YE12fuU6t599IgnWlLy0+VXo9F9etVNlPrWR3eZuTia5fjfcnCtZoWn2AaSmwzPPCLaqSNNP8udjvvuInPINKzxhvp0lT6/k3imC1i8g3gBeO3Fgnu8rZMvkVh++nZrK7vFNCfCDhCG+QrZ6dwnxx0t0ZxrFlykTXr8b708yCFfz+Pwl4DrDOJ/qv8zCeDl/jIHh7SaO+gG2fi9cODyfq9gSbm4FHPaPKpKn1/BtFsJ4uIjcAy0durJO7Xfge4/D91IxfXhmjEdSKeZkMCbDSF3t4pi9rdpyvUJ/3xqneBf6kL3lWK9N+XuM0z0Dt96cL+H5GgvVZ4C3pjZNg1LnWePyHMc71qdAOPBX4bV8h6gRgcUb3rULBX3o/A64D/scFrfrDO4Jaz78RBCsA7xSRK+p2lIzmq55va5gMjt/MxJMOPjddVwc/AP45vTHFIuBpwGuBFwCrJ7H0+lXAZemNE9Dq33lSuqIOrvP5oIcxRvPsBC4HVtV4f9q8u784XVEHW3zyfa2Muoc1Hv9hjHF9cr7m4pm+wMrZ3u2b2s4mx5BnDf4a8GUfve9Nf6hCzedv2XGNmZEuU6VUKlUtqlopXap6Z/pg6kTN7O1ZHr+ZiZl9Pr2jOql6jb3kzexFZvZdM+tOf3ECPlrl9yYq7Wb24/QP1ck7qvw+ZjbyPo8sy1T1blVN/858YNQ9nCqp6yVmtsqv531m1pfe+QxSMrOdZvYtM9tgZi3pe1vP+WdhkcwmOeAi7+5kwX7PJT/fWAz8ZXn1ZV6SkQURmV+0eQrxbwEf9OXrFqY/NIME95H9DvAVX2F7ffpDtTKfBSvnC2G+bRJdnslyD3B/euMcRtw/8SngPXEOZFOSeA63/+fltDm4OOwyX+37OuANU8mGMu2ClTYBay0iUq2Ir3LzMRHpqrkfXJ0S8HUf9ZgvnAhc60uUtaYrI/OftCsk5RJZYGYXm9nX3E/amf7+HCK4b/WzwDWV1dbTz3u6pJl2wZoGWtxx+gmPG8mKR8dy/M5R1vjo3ukz5EyNzC2OBq70rtZ8Woeg1XtGn3MBq0mDavrwLBO8D/xJ4AveFcqSm3w9xPnAah+VzWIF48j8o2JZ/5mIdGTUw5hJgo9gf8VH5CetQ5P+4CwhHtB2GvA+T9R3MXBU+oNTZB/w+Uoowxwn7/E/586D+xfJnpPcOjl/DvqqakE8aPXDwO9Pdnm9LOOwbgG+lN44BfIe5Haqv1GOniZrouhxSH9TTbCm+vbyOKx/Av4oXVcHn3XR/id3ZGZFPXFY7cB/Ac9OV9TB5cDfpTcydpzRMg8APWWq92cWGBWvONHxV+IQ/XNP9e+fXXkWJvr+PGGXr4D1tfQzmD6/LAVrvvJ9N0v3piuocsFqJWPBusmFO+vucBSsmaNewXqy9wIOipVvH/nx+cxeD8vYON5MgGbvUjzuJmlVsZqDnOPWZqRJ8FHxY9y5PsqySj/M85yjgA9MFKvVzILV7xco6yXvp5OWJr9nzUi7jwaeP9KymkbMJzD3ezaG/hlMjHkG8A8+B7Yqzdr4C8CnPR5kpm5GpA4qlsRYZb5TZdrRyCIeAvBKEUmm6bxLPnH5+8BHPMDzd4GXefjQb3t+uL9wH+qdnrFhOhAfPXxrRZvScVnNKlgPedRtTakwIpEZ5mnAu3ykPEvMR8b/G3g78CLgFcA7/EX+X8DNnjbmB57M8mofnX6xC9rHgV/4oFWW5NyXdXq6gia2sNYB/+rTeuK8u8hcZDnwIRE5IWOLasDnnP428Hse13jvJK0m9bRLG32Q5nwfMHkw/cEpcjzwfs8wMYpmHyUsuHC9z1NiHHYtptpYMh4lnC7m7CjhGLT5A3dYg56Axd616UpX1EG9YTz3+3dh7FFQgAuBz4lIVvNk8Tb+YT/uMVO+1EjwfGtXuw8qKyNoyK2/a0aNGja5YOFvjbv9Rn41nXRsngtWydPZ7vSR0IdGnF+Xh0gs9wb83tR3J2I2Bate5lzG0TEev5UeBX72VNufY37el7sPakppjcdgDfBO4H9lmIzgfvelHbTgslLD+UxwX8HHgT/I8GLPJt3ADcClnj31BcDLgT/xh+zNwKvcH/H8jBbviGRDxdF+RrqiTsz9UW8F7pgmscJF5Z0+HzerfZyQTnwZBesQXS5ab5rHC6kecKF6lZdPu/X4mPsuRr7OC57/62GPNI7MDVa6NZ7VtJtbXay2pCumgX0esX5LNfdKHeQ9c+6iyoYoWKM5AviQJwWc1NymOcRWzzX0GneKZuWjiMwc4lZ+VjMZHgX+qrKgygzxoIdG/CJdUSfP8YBpiIJVlQ5fLmyD+/gOiwUZWeYI93p379tuZR0kHbdUa5lt0sdTa5lu0vurtaRYmOGk5gLwMQ9NmGnuczdDFiEP7f4SzhMFa0xW+ajH09IVcwzz5ZXe6BH7c0ZBI3XxpIymXpkPiHwxPYg0Q5gnw9ycrqiTDR6KFAVrHE72cIesg/ay5Akf+dkUxWreI8BLM0qdtMfzuv8mXTGD7AT+3n2nU2Wli1YUrAl4ri/qcJjtPgcoeTjCremKyLykw0d0s2hrD/qAyvGzXLYAv04fXB3kXLDyMQ5rYu71BGNb0xVMIk5rGuOwNvnw96PpipFMdHwTMU7zmJE4rIyPP/M4rKken+rBCICn+/Ucleeszt/v95HhMW/eDCF+Plms3vMT4CVZCtZA2uE7zeT9rZTP6K00FurhDn+VTi7GJBrUNAnWkM/r+sJEjXKi45uIcZpHFKxsBeti/81RvZ6p/n4D8Qjw4iwF6yvA36Y3TiOt7hw/1XObP8n7utPRzX3U/Qv3pCsmalDTJFi3+3pvE+bxmuj4JmKc5hEFKzvBSjw53xvS9VP9/QZiEPiDLB/uJ3w4c6bKz3zRyA/4w3u+r8vWkz6wDFjpgjVXWs+tHqQXaQwWZ7gYcKPSCpySpWBVRarEnmRZvEs04CJ2uZvW903UVaoR8cm2cyGzwyDww8r5pa9HukTmNn6flojIsvS9i/dvFAI8ZdoFa4YZ8AnMr3bTP0vROs1npc82D2QY3xKZGxwXV+2eFCc2mmDhIvUL4E8zjvLt8K7nbE/ZudPjbCKNwzJPfx0Zn2WNKFgVfuVdxIfSFVPgnFl+Exrw04ymPETmDkdkNB2n0WlvZMHCndMfrBaOUCdrMxphqpeBaiOVkUiT0NnogqXAjRkuQd/hYRSzxROeDiYSaUoaXbDwgLOvZ+SAF3e+z5Yf63FPzheJNCXNIFgKXO8PexYcP4sO0n0xz1WkmZn3gpWOW0kXZ5uXLGiZxQDSnllKFxKJzAWK816wJsl+4JfpjXXSMot537vjCGFkHHrdx/lQg5Z7s5xLWHUVkdmO1h1xelcA7xldWxd3AOe5A3zC88t4LuFh13ii/U+VcZpHnEuYwVxCP76LfVXlqf0YfMfX2mxUK7yEZcc1lbTBI8tsM+JY/jp9wHWy2cyOmOz5mZmY2efTP1Inh13j6Sa9vxGl3cx+nD7AOnlHld/P5PxSv9dlZvend14n12R4fC81s8H0DurgFjPrTF/DRirN0iVkFrtxkchE7PEcVlNlrU/Ub1iaRbDE52tFInORXRll31juqb0blmYRrA7Pl5UFxQb2EURmhydGrm48BfKeZnm24gSnnWYRrNUZCtZwHKmLZMyg53fLgg2N3C2c94KVdsqli3cHn5fOlT0FihlFzUciFcznvQ6mK+pgDfDiyY44puMWay3p563WMhHp/c17wZoEXRmv5Lzdc6pHIllyN7AjvbEOKsu7t6crGoFmEKwzM1z624Cf+3SfSCRLdmWYv+1pwDPSG2eRo/2Y2tIVtdLogrXWgxKnfKGcHs9HFYlkzbDPec1i4dEjvN0vT1fMAu3A/wVuAK4DLgXW15v/q5EF6wjPhZVlWuPtnhgwEpkONmWYCumFwP+e5fhDAc4FLvAVrV8OXO0zJK4ETp/ImAghICNmEzSqYC3yJcd+P+NzvG2Wl/+ONDaPuS8rC/K+dmVWq0nXinjuuPf781gh5wMDlwHf9Wlr5wErqvmZVRUzI5crV2X5MM8FBFgHfBJ4U8ZpYPqAb8YYrMg0Mgxcm2HOs2XAhz2H20xzsovRKekKR7zL+npfOOb7wHtd5A4+txULq1QqEUJoKMFa4Cbn9cAfTGRq1sE9brJHItPJbcAt6Y1T4CRfr/OUGbS0ngx8FHj6JPfZ6RPS3w18zw2OZwPtw8Ojs5tPu2Cl4y4yKmJmeTM7wm/EH7maX+sKnfV5mc+EfyJdEYlkTB/wCe8eZoEAZ3l2iQ1pZ3eVZ6umkoqTahGRC0TkSyLywnQMVbWSQoBjgDcC3wauCyG8VFXFzCiVSmSZXub+jN8M4xGApb5U/fFu+mYtUiPZ60t83Z6uqHLRRxHTy0yKZk8vkyYPfNyXqsuSPcBV3h6zysBbocuF5v8AS9KVdVIE3gp87uCWdH6KyGGomX3OzFrSb5cxGtsoYnqZSdHs6WWqleeY2b70TjNgyMy+bmZnmdmCKvutpQQzW2xmF5jZ/5jZcHpnU+SXZrZu5D6n0yppFLYAHwMK6YpIZBr5iVtDWc+qaAFe4QNI17vlv6aGASpxn9PpHjZ0g7tinpXubk6RXg99GDUpPArW+BTcAZhVeuVIZLIMA9e4E3rqptxoxOOiXuL72Aj8C/Bnvu0kD7o+1tMyrXdBejXwIffnfs+78me5gGWJAd9wQR01qyQK1vjcBvxb+qJFIjPEEz7UvyVdkSF5F6dXu7P/ax5icDPwQ//3Zrekvgy8A3iu+42n5sAbm3uBD/gAxCiiYI3Nbg96i4GikdnkHhetrJ3k1RAPBzrKB7TWendxhVtRWXb5xuJxf+6qinQUrOoMeBzJD9MVkcgMY74Q8AerWRwNxpCPjn5jrG5wFKzDKQH/6KWYjhtJl0hkKqTbU7o4BeDTHljZM/oXGoYhH2T4e/ffQZXrEwVrNOrzmz7cBG+zyPxiwB3kf9eAbXMY+Lyf24F05UiiYB1i2Ec/LvUAu0hkrjHgVsiVGc43nG36PQj3Xb7g8bhEwSpT9NGRN/kKs5HIXKUiWpekY5TmIQc8V9blk532FgWr3AD+CXh7tKwi84Qh4N99kv+P52nYzXbvzXy0li5uswvWDjdFL/MwhkhkvqAeJ/gGD27eNdbI2hxj0INOLwS+VOvCG80qWMPAf3uy/k/4NIBIZD6y3Sccvwa4aRqm8mSFeTbVv/AcWLfUYxk2m2CpW1JX+UX7cUzIF2kAii4ArwP+3INN58rcV/VUOZ/zVMnXTGXAoFkES/1N9DfA+R45/BhV4jzSJRKZTdLtMV1S7PP4wZd5l+s7UxGHKVL0ObhXAi91f9VdaasqfT7pkqbRBWsYuM8F6mUeX3X3HHr7RCJZY8AjvkLNa31dg88AW0cGZE4T5lNrbgb+coRxsDmrrmqjCdawOx9vB/4VuNjV/UoXrtj9izQTfZ6w8BJf6OFCF68f+epPB9IWT40UfGT9Lk/m+AE3DF7uEesPTfH3DyPLjKMzjbm52+dvjy0uVHf6heqdzBulmtmZJTHj6KRo2oyjU2Wc+zMWOV//YClwgqeSORl4kqeSWQgsBlpHfMc8qHPQn7kt7mK53TMNP+pThgZrHams9fr9f61Y6equPQnPAAAAAElFTkSuQmCC';

  /* ======================================================================
   * Helpers
   * ==================================================================== */
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
  const asNum = x => { if (x === '' || x == null) return null; const n = Number(x); return Number.isFinite(n) ? n : null; };
  const key = s => String(s ?? '').trim().toLowerCase();
  const initials = n => String(n).split(/\s+/).map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  // Hali Polar (dark) accents
  const C = {
    brand: '#6CD4F0', success: '#7EE2B8', warning: '#F5C96B', danger: '#F58A80',
    orange: '#F5A06B', info: '#7FA6F5', purple: '#B3A4FF', strong: '#2B3961',
  };
  const feedbackColor = l => {
    const k = key(l);
    if (k.includes('very bad') || k.includes('verybad')) return C.danger;
    if (k === 'bad') return C.orange;
    if (k.includes('awesome')) return C.success;
    if (k.includes('good')) return C.brand;
    if (k === 'ok' || k.includes('okay') || k.includes('neutral')) return C.warning;
    if (k.includes('no feedback')) return C.strong;
    return C.info;
  };
  const priorityPalette = [C.info, C.purple, C.brand, C.warning];
  const priorityColor = (l, i) => {
    const k = key(l);
    if (k.includes('sev 1') || k.includes('critical') || k.includes('high')) return C.danger;
    if (k.includes('sev 2') || k.includes('med')) return C.orange;
    if (k.includes('sev 3') || k.includes('low')) return C.success;
    return priorityPalette[i % priorityPalette.length];
  };

  /* ======================================================================
   * State
   * ==================================================================== */
  const state = {
    closed: [], actionable: [],
    priority: {}, feedback: {},
    kpi: { opened: null, closed: null, open: null },
    sla: { response: null, fix: null },
    syncedAt: null,
    seen: {}, // debug: reportId -> { url, rows, keys, counter }
  };

  /* ======================================================================
   * Report handlers
   * ==================================================================== */
  const rowsOf = p => (Array.isArray(p?.report?.rows) ? p.report.rows : null);

  function agentList(payload, valueKey) {
    const rows = rowsOf(payload);
    if (!rows) return null;
    const out = rows.map(r => {
      const name = r?.Agent, n = asNum(r?.[valueKey]);
      return (!name || n == null) ? null : [String(name), n];
    }).filter(Boolean);
    return out.sort((a, b) => b[1] - a[1]);
  }

  function pieFromChart(payload) {
    const l = payload?.report?.chart_labels, d = payload?.report?.chart_dataset;
    if (!Array.isArray(l) || !Array.isArray(d) || l.length !== d.length) return null;
    const o = {};
    l.forEach((label, i) => { const v = asNum(d[i]); if (label != null && v != null) o[String(label)] = v; });
    return o;
  }

  const handlers = {
    closedByAgent(p) { const l = agentList(p, 'Tickets Closed'); if (!l) return false; state.closed = l; return true; },
    actionableByAgent(p) { const l = agentList(p, 'Actionable Tickets'); if (!l) return false; state.actionable = l; return true; },
    priorityPie(p) { const o = pieFromChart(p); if (!o || !Object.keys(o).length) return false; state.priority = o; return true; },
    feedbackPie(p) {
      const o = pieFromChart(p);
      if (o && Object.keys(o).length) { state.feedback = o; return true; }
      const rows = rowsOf(p);
      if (rows && rows.length) {
        const counts = {};
        for (const r of rows) { const k = String(r?.Score ?? '').trim() || 'Unknown'; counts[k] = (counts[k] || 0) + 1; }
        state.feedback = counts;
      } else state.feedback = {};
      return true;
    },
    kpiOpened: p => counter(p, 'opened'),
    kpiClosed: p => counter(p, 'closed'),
    kpiOpen: p => counter(p, 'open'),
    slaTable(p) {
      const rows = rowsOf(p); if (!rows || !rows.length) return false;
      const pick = rows.find(r => CONFIG.slaArea.test(String(r?.Area ?? ''))) || rows[0];
      const col = re => Object.keys(pick).find(k => re.test(k));
      const resp = asNum(pick[col(/response/i)]), fix = asNum(pick[col(/fix/i)]);
      if (resp == null && fix == null) return false;
      state.sla = { response: resp, fix };
      return true;
    },
  };
  function counter(p, k) { const n = asNum(p?.report?.counter_value); if (n == null) return false; state.kpi[k] = n; return true; }
  // Actionable KPI = sum of every visible agent row, as before
  const actionableTotal = () => state.actionable.length ? state.actionable.reduce((a, [, n]) => a + n, 0) : null;

  function onReport(url, json) {
    const m = /\/api\/Report\/(\d+)/i.exec(url);
    if (!m) return;
    const id = m[1];
    const rows = rowsOf(json);
    state.seen[id] = {
      url, rows: rows ? rows.length : null,
      keys: rows && rows[0] ? Object.keys(rows[0]) : null,
      counter: json?.report?.counter_value ?? null,
      chart: Array.isArray(json?.report?.chart_labels) ? json.report.chart_labels.length : null,
      name: json?.report?.name ?? null,
      sample: rows && rows[0] ? rows[0] : null,
    };
    const role = id === String(CONFIG.slaReport) ? 'slaTable' : CONFIG.reports[id];
    if (role && handlers[role]?.(json)) { state.syncedAt = new Date(); schedule(); }
    else if (debugOpen) schedule();
  }

  /* ======================================================================
   * Rendering helpers
   * ==================================================================== */
  const crown = `<svg class="crown" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 16 3 6l5 4 4-6 4 6 5-4-2 10H5zm0 2h14v2H5z"/></svg>`;

  function rowsHTML(list, { crownAt = null } = {}) {
    if (!list.length) return `<div class="empty">Waiting for data…</div>`;
    const max = Math.max(1, ...list.map(x => x[1]));
    return list.map(([name, n]) => {
      const lead = crownAt != null && n >= crownAt;
      return `<div class="row${lead ? ' lead' : ''}">
        <div class="bar" style="width:${(n / max * 100).toFixed(1)}%"></div>
        <div class="av">${esc(initials(name))}</div>
        <div class="nm"><span>${esc(name)}</span>${lead ? crown : ''}</div>
        <div class="n">${n}</div></div>`;
    }).join('');
  }

  function donut(obj, colorFn, label, size) {
    const entries = Object.entries(obj).filter(([, v]) => v > 0);
    const total = entries.reduce((a, [, v]) => a + v, 0);
    let bg = `${C.strong} 0 360deg`;
    if (total > 0) {
      let acc = 0;
      bg = entries.map(([k, v], i) => {
        const a = acc / total * 360; acc += v;
        return `${colorFn(k, i)} ${a.toFixed(2)}deg ${(acc / total * 360).toFixed(2)}deg`;
      }).join(',');
    }
    return `<div class="donut" style="--s:${size}px;background:conic-gradient(${bg})">
      <div class="c"><b>${total}</b><span>${esc(label)}</span></div></div>`;
  }
  function legend(obj, colorFn, emptyText) {
    const entries = Object.entries(obj);
    if (!entries.length) return `<div class="legend"><div class="lg"><span><i style="background:${C.strong}"></i>${esc(emptyText)}</span><b>0</b></div></div>`;
    return `<div class="legend">${entries.map(([k, v], i) =>
      `<div class="lg"><span><i style="background:${colorFn(k, i)}"></i><em>${esc(k)}</em></span><b>${v}</b></div>`).join('')}</div>`;
  }
  const pieCard = (title, obj, colorFn, label, size, emptyText) =>
    `<div class="eyebrow">${esc(title)}</div><div class="flex">${donut(obj, colorFn, label, size)}${legend(obj, colorFn, emptyText)}</div>`;

  const fmt = v => v == null ? '—' : String(Math.round(v * 100) / 100);

  function slaRing(label, pct) {
    const t = CONFIG.slaTargetPct;
    if (pct == null) return `<div class="slaItem"><div class="donut" style="--s:150px;background:conic-gradient(${C.strong} 0 360deg)"><div class="c"><b>—</b></div></div><span class="slaLabel">${label}</span></div>`;
    const col = pct >= t ? C.success : pct >= t - 5 ? C.warning : C.danger;
    const deg = Math.max(0, Math.min(100, pct)) * 3.6;
    return `<div class="slaItem"><div class="donut" style="--s:150px;background:conic-gradient(${col} 0 ${deg.toFixed(1)}deg,${C.strong} ${deg.toFixed(1)}deg 360deg)">
      <div class="c"><b style="font-size:30px;color:${col}">${pct.toFixed(1)}<small>%</small></b></div></div><span class="slaLabel">${label}</span></div>`;
  }
  function slaHTML() {
    return `<div class="eyebrow">Reactive ticket SLA · target ${CONFIG.slaTargetPct}%</div>
      <div class="flex" style="justify-content:space-around">${slaRing('Response', state.sla.response)}${slaRing('Fix', state.sla.fix)}</div>`;
  }

  /* ======================================================================
   * Overlay
   * ==================================================================== */
  const CSS = `
    :host{all:initial}
    *{box-sizing:border-box;margin:0}
    .wrap{position:fixed;inset:0;background:#0F1522;overflow:hidden;
      --sunken:#0F1522;--default:#111827;--raised:#18213A;--overlay:#1F2A4D;--strong:#2B3961;
      --text:#F1F5FB;--subtle:#A2AABA;--subtlest:#8693A9;--brand:#6CD4F0;--brand-c:#233E4F;--on-brand:#111827;
      --success:#7EE2B8;--warning:#F5C96B;--danger:#F58A80;
      --shadow:0 1px 2px rgba(0,0,0,.28),0 8px 24px -10px rgba(0,0,0,.5);
      font-family:"IBM Plex Sans",system-ui,sans-serif;color:var(--text)}
    .stage{width:1920px;height:1080px;transform-origin:top left;position:absolute;left:0;top:0;
      background:radial-gradient(1200px 500px at 50% -10%,rgba(108,212,240,.14),transparent 70%),var(--default);
      padding:32px 40px;display:grid;grid-template-rows:auto 1fr;gap:24px}
    .hdr{display:flex;align-items:center;justify-content:space-between}
    .brand{display:flex;align-items:center;gap:20px}
    .brand img{height:72px}
    h1{font:700 34px/40px "Bricolage Grotesque","IBM Plex Sans",sans-serif;letter-spacing:-.02em}
    .sub{font:500 13px "IBM Plex Sans";color:var(--subtle);letter-spacing:.02em}
    .pill{display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 16px;border-radius:9999px;background:var(--raised);font:500 14px "IBM Plex Sans";color:var(--subtle)}
    .pill i{width:8px;height:8px;border-radius:50%;background:var(--success);box-shadow:0 0 10px var(--success)}
    .pill.stale i{background:var(--warning);box-shadow:0 0 10px var(--warning)}
    .grid{display:grid;gap:24px;min-height:0}
    .card{background:var(--raised);border-radius:28px;padding:24px;box-shadow:var(--shadow);min-height:0;display:flex;flex-direction:column;overflow:hidden}
    .card.hero{border-radius:32px;background:linear-gradient(160deg,var(--overlay),var(--raised))}
    .eyebrow{font:600 13px "IBM Plex Sans";letter-spacing:.12em;text-transform:uppercase;color:var(--subtle);margin-bottom:14px}
    .kpi{justify-content:center;gap:8px}
    .kpi .eyebrow{margin:0}
    .big{font:600 60px/1 "IBM Plex Mono",monospace;letter-spacing:-.02em}
    .delta{font:500 14px "IBM Plex Sans";color:var(--subtlest);min-height:18px}
    .rows{display:grid;gap:8px;align-content:start;overflow:hidden;flex:1;min-height:0;scrollbar-width:none}
    .row{display:grid;grid-template-columns:44px 1fr auto;align-items:center;gap:14px;height:64px;padding:0 18px 0 12px;border-radius:8px;background:var(--overlay);position:relative;overflow:hidden}
    .row>.bar{position:absolute;left:0;top:0;bottom:0;background:var(--brand-c);z-index:0}
    .row>:not(.bar){position:relative;z-index:1}
    .av{width:36px;height:36px;border-radius:50%;background:var(--strong);display:grid;place-items:center;font:600 13px "IBM Plex Sans"}
    .nm{font:600 20px "IBM Plex Sans";display:flex;align-items:center;gap:10px;min-width:0}
    .nm span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .n{font:600 28px "IBM Plex Mono",monospace}
    .row.lead .av{background:var(--warning);color:var(--on-brand)}
    .crown{width:24px;height:24px;flex:none;fill:var(--warning);filter:drop-shadow(0 0 6px rgba(245,201,107,.6))}
    .empty{color:var(--subtlest);font:500 16px "IBM Plex Sans";padding:12px}
    .flex{display:flex;align-items:center;gap:24px;flex:1;min-height:0}
    .donut{width:var(--s);height:var(--s);border-radius:50%;display:grid;place-items:center;flex:none;position:relative}
    .donut::after{content:"";position:absolute;inset:22px;border-radius:50%;background:var(--raised)}
    .hero .donut::after{background:var(--overlay)}
    .c{position:relative;z-index:1;text-align:center}
    .c b{display:block;font:600 40px/1 "IBM Plex Mono",monospace}
    .c span{font:500 12px "IBM Plex Sans";color:var(--subtle);letter-spacing:.08em;text-transform:uppercase}
    .legend{display:grid;gap:8px;flex:1;min-width:0}
    .lg{display:flex;align-items:center;justify-content:space-between;gap:12px;height:48px;padding:0 16px;border-radius:8px;background:var(--overlay);font:600 18px "IBM Plex Sans"}
    .lg span{display:flex;align-items:center;gap:12px;min-width:0}
    .lg em{font-style:normal;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .lg i{width:12px;height:12px;border-radius:4px;flex:none}
    .lg b{font:600 22px "IBM Plex Mono",monospace}
    .slaItem{display:grid;justify-items:center;gap:10px}
    .slaLabel{font:600 14px "IBM Plex Sans";letter-spacing:.12em;text-transform:uppercase;color:var(--subtle)}
    .c small{font-size:16px;color:var(--subtle)}
    kbd,code{font:500 14px "IBM Plex Mono",monospace;background:var(--raised);padding:1px 6px;border-radius:4px;color:var(--text)}
    .debug{position:absolute;inset:40px;z-index:10;background:rgba(15,21,34,.97);border-radius:28px;padding:28px;overflow:auto;box-shadow:0 16px 40px rgba(0,0,0,.6);font:500 14px "IBM Plex Mono",monospace;display:none}
    .debug.on{display:block}
    .debug h2{font:700 22px "Bricolage Grotesque",sans-serif;margin-bottom:12px}
    .debug table{border-collapse:collapse;width:100%}
    .debug td,.debug th{text-align:left;padding:6px 10px;border-bottom:1px solid #2B3961;vertical-align:top}
    .debug th{color:var(--subtle)}
    .debug .mapped{color:var(--success)}
  `;

  let ui = null, debugOpen = false, queued = false;

  function build() {
    const host = document.createElement('div');
    Object.assign(host.style, { position: 'fixed', inset: '0', zIndex: '2147483647' });
    document.documentElement.appendChild(host);
    document.documentElement.style.overflow = 'hidden';

    const root = host.attachShadow({ mode: 'open' });
    const font = document.createElement('link');
    font.rel = 'stylesheet';
    font.href = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap';
    root.appendChild(font);
    const style = document.createElement('style');
    style.textContent = CSS;
    root.appendChild(style);

    const wrap = document.createElement('div');
    wrap.className = 'wrap';
    wrap.innerHTML = `
      <div class="stage" id="stage">
        <div class="hdr">
          <div class="brand"><img src="${LOGO}" alt="Brite">
            <div><h1>Network Operations Center</h1><div class="sub">Brite · HaloPSA live dashboard</div></div></div>
          <div class="pill" id="sync"><i></i><span>Waiting for data…</span></div>
        </div>
        <div class="grid" style="grid-template-rows:auto 1fr">
          <div class="grid" style="grid-template-columns:1.25fr repeat(4,1fr)">
            <div class="card hero" id="sla"></div>
            <div class="card kpi"><div class="eyebrow">Tickets opened</div><div class="big" id="k-opened">—</div><div class="delta"></div></div>
            <div class="card kpi"><div class="eyebrow">Tickets closed</div><div class="big" id="k-closed">—</div><div class="delta" id="d-closed"></div></div>
            <div class="card kpi"><div class="eyebrow">Open tickets</div><div class="big" id="k-open">—</div><div class="delta"></div></div>
            <div class="card kpi"><div class="eyebrow">Actionable</div><div class="big" id="k-action">—</div><div class="delta" id="d-action"></div></div>
          </div>
          <div class="grid" style="grid-template-columns:1.1fr 1.1fr .9fr">
            <div class="card"><div class="eyebrow">Tickets closed · by agent</div><div class="rows" id="closed"></div></div>
            <div class="card"><div class="eyebrow">Actionable · by agent</div><div class="rows" id="actionable"></div></div>
            <div class="grid" style="grid-template-rows:1fr 1fr">
              <div class="card" id="feedback"></div>
              <div class="card" id="priority"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="debug" id="debug"></div>`;
    root.appendChild(wrap);

    const $ = id => root.getElementById(id);
    const stage = $('stage');
    const fit = () => {
      const s = Math.min(innerWidth / 1920, innerHeight / 1080);
      stage.style.transform = `scale(${s})`;
      stage.style.left = `${(innerWidth - 1920 * s) / 2}px`;
      stage.style.top = `${(innerHeight - 1080 * s) / 2}px`;
    };
    addEventListener('resize', fit); fit();

    addEventListener('keydown', e => {
      if (e.key.toLowerCase() !== 'd' || e.ctrlKey || e.metaKey || e.altKey) return;
      if (/input|textarea/i.test(e.target?.tagName || '')) return;
      debugOpen = !debugOpen; $('debug').classList.toggle('on', debugOpen); render();
    });

    const el = {
      sla: $('sla'), sync: $('sync'), debug: $('debug'),
      opened: $('k-opened'), closed: $('k-closed'), open: $('k-open'), action: $('k-action'),
      dClosed: $('d-closed'), dAction: $('d-action'),
      listClosed: $('closed'), listAction: $('actionable'),
      feedback: $('feedback'), priority: $('priority'),
    };
    startScroller(el.listClosed); startScroller(el.listAction);
    return el;
  }

  // Replace content but keep the scroll position so auto-scroll doesn't jump on every refresh
  const setHTML = (node, html) => { if (node.__html === html) return; const t = node.scrollTop; node.innerHTML = html; node.__html = html; node.scrollTop = t; };

  function render() {
    if (!ui) return;
    setHTML(ui.sla, slaHTML());
    ui.opened.textContent = fmt(state.kpi.opened);
    ui.closed.textContent = fmt(state.kpi.closed);
    ui.open.textContent = fmt(state.kpi.open);
    const act = actionableTotal();
    ui.action.textContent = fmt(act);
    ui.dClosed.textContent = (state.kpi.opened && state.kpi.closed != null) ? `${Math.round(state.kpi.closed / state.kpi.opened * 100)}% of opened` : '';
    ui.dAction.textContent = (state.kpi.open && act != null) ? `${(act / state.kpi.open * 100).toFixed(1)}% of open` : '';

    setHTML(ui.listClosed, rowsHTML(state.closed, { crownAt: CONFIG.crownAt }));
    setHTML(ui.listAction, rowsHTML(state.actionable));
    setHTML(ui.priority, pieCard('Tickets by priority', state.priority, priorityColor, 'open', 150, 'No tickets'));
    setHTML(ui.feedback, pieCard('Customer feedback', state.feedback, feedbackColor, 'surveys', 170, 'No feedback'));

    if (state.syncedAt) {
      ui.sync.querySelector('span').textContent = `Synced ${state.syncedAt.toLocaleTimeString()}`;
      ui.sync.classList.toggle('stale', Date.now() - state.syncedAt > 10 * 60000);
    }
    if (debugOpen) renderDebug();
  }

  function renderDebug() {
    const mapped = { ...CONFIG.reports, [CONFIG.slaReport]: 'slaTable' };
    const rows = Object.entries(state.seen).sort((a, b) => a[0] - b[0]).map(([id, s]) => `
      <tr><td>${id}</td><td class="${mapped[id] ? 'mapped' : ''}">${esc(mapped[id] || 'unmapped')}</td>
      <td>${esc(s.name ?? '')}</td>
      <td>${s.rows != null ? s.rows + ' rows' : ''}${s.counter != null ? 'counter=' + esc(s.counter) : ''}${s.chart != null ? s.chart + ' chart pts' : ''}</td>
      <td>${esc((s.keys || []).join(', '))}</td></tr>`).join('');
    ui.debug.innerHTML = `<h2>Reports seen on this dashboard (press D to close)</h2>
      <table><tr><th>ID</th><th>Role</th><th>Name</th><th>Shape</th><th>Columns</th></tr>${rows || '<tr><td colspan=5>Nothing captured yet – wait for the dashboard to refresh.</td></tr>'}</table>
      <p style="margin-top:16px;color:#A2AABA">Full payload summaries are also in the console as <code>__NOC.seen</code>.</p>`;
  }

  function schedule() { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; render(); }); }

  /* ======================================================================
   * Auto-scroll (one loop per list, started once)
   * ==================================================================== */
  function startScroller(el) {
    const S = CONFIG.scroll;
    let last = 0, pauseUntil = performance.now() + S.topPauseMs, returning = false;
    const tick = t => {
      const max = el.scrollHeight - el.clientHeight;
      if (max <= 2) { el.scrollTop = 0; last = t; return requestAnimationFrame(tick); }
      const dt = Math.min(0.05, (t - (last || t)) / 1000); last = t;
      if (t >= pauseUntil) {
        if (!returning) {
          el.scrollTop += S.pxPerSecond * dt;
          if (el.scrollTop >= max - 1) { returning = true; pauseUntil = t + S.bottomPauseMs; }
        } else {
          el.scrollTop = Math.max(0, el.scrollTop - S.resetStepPx);
          if (el.scrollTop <= 0) { returning = false; pauseUntil = t + S.topPauseMs; }
        }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ======================================================================
   * Network interception (fetch + XHR)
   * ==================================================================== */
  const DASH_QUERY = `dashboard_id=${CONFIG.dashboardId}`;
  const wanted = url => typeof url === 'string' && url.includes(DASH_QUERY) && /\/api\/Report\/\d+/i.test(url);

  const origFetch = window.fetch;
  window.fetch = async function (...args) {
    const res = await origFetch.apply(this, args);
    try {
      const a = args[0];
      const url = typeof a === 'string' ? a : (a && a.url) || String(a || '');
      if (wanted(url) && (res.headers.get('content-type') || '').includes('application/json')) {
        res.clone().json().then(d => onReport(url, d)).catch(() => {});
      }
    } catch (_) {}
    return res;
  };

  const xOpen = XMLHttpRequest.prototype.open, xSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (m, u, ...r) { this.__nocUrl = String(u || ''); return xOpen.call(this, m, u, ...r); };
  XMLHttpRequest.prototype.send = function (...a) {
    if (wanted(this.__nocUrl)) {
      this.addEventListener('load', () => {
        try {
          const d = (this.responseType === '' || this.responseType === 'text') ? JSON.parse(this.responseText) : this.response;
          if (d && typeof d === 'object') onReport(this.__nocUrl, d);
        } catch (_) {}
      });
    }
    return xSend.apply(this, a);
  };

  /* ======================================================================
   * Boot
   * ==================================================================== */
  window.__NOC = { state, seen: state.seen, config: CONFIG };

  const boot = () => { if (ui) return; if (!document.body) return requestAnimationFrame(boot); ui = build(); render(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
