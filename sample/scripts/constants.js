var server = "http://159.65.146.12:3020"

function merge(a, b) {
    for(var idx in b) {
        a[idx] = b[idx];
    } //done!
}

function isEmpty (object){
  if(Object.keys(object).length>0){
    return true
  }else{
    return false
  }
}

const htmlEmail = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"> <html xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml"> <head> <!--[if gte mso 9]><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]--> <meta content="text/html; charset=utf-8" http-equiv="Content-Type"/> <meta content="width=device-width" name="viewport"/> <!--[if !mso]><!--> <meta content="IE=edge" http-equiv="X-UA-Compatible"/> <!--<![endif]--> <title></title> <!--[if !mso]><!--> <!--<![endif]--> <style type="text/css"> body { margin: 0; padding: 0; } table, td, tr { vertical-align: top; border-collapse: collapse; } * { line-height: inherit; } a[x-apple-data-detectors=true] { color: inherit !important; text-decoration: none !important; } .ie-browser table { table-layout: fixed; } [owa] .img-container div, [owa] .img-container button { display: block !important; } [owa] .fullwidth button { width: 100% !important; } [owa] .block-grid .col { display: table-cell; float: none !important; vertical-align: top; } .ie-browser .block-grid, .ie-browser .num12, [owa] .num12, [owa] .block-grid { width: 675px !important; } .ie-browser .mixed-two-up .num4, [owa] .mixed-two-up .num4 { width: 224px !important; } .ie-browser .mixed-two-up .num8, [owa] .mixed-two-up .num8 { width: 448px !important; } .ie-browser .block-grid.two-up .col, [owa] .block-grid.two-up .col { width: 336px !important; } .ie-browser .block-grid.three-up .col, [owa] .block-grid.three-up .col { width: 336px !important; } .ie-browser .block-grid.four-up .col [owa] .block-grid.four-up .col { width: 168px !important; } .ie-browser .block-grid.five-up .col [owa] .block-grid.five-up .col { width: 135px !important; } .ie-browser .block-grid.six-up .col, [owa] .block-grid.six-up .col { width: 112px !important; } .ie-browser .block-grid.seven-up .col, [owa] .block-grid.seven-up .col { width: 96px !important; } .ie-browser .block-grid.eight-up .col, [owa] .block-grid.eight-up .col { width: 84px !important; } .ie-browser .block-grid.nine-up .col, [owa] .block-grid.nine-up .col { width: 75px !important; } .ie-browser .block-grid.ten-up .col, [owa] .block-grid.ten-up .col { width: 60px !important; } .ie-browser .block-grid.eleven-up .col, [owa] .block-grid.eleven-up .col { width: 54px !important; } .ie-browser .block-grid.twelve-up .col, [owa] .block-grid.twelve-up .col { width: 50px !important; } </style> <style id="media-query" type="text/css"> @media only screen and (min-width: 695px) { .block-grid { width: 675px !important; } .block-grid .col { vertical-align: top; } .block-grid .col.num12 { width: 675px !important; } .block-grid.mixed-two-up .col.num3 { width: 168px !important; } .block-grid.mixed-two-up .col.num4 { width: 224px !important; } .block-grid.mixed-two-up .col.num8 { width: 448px !important; } .block-grid.mixed-two-up .col.num9 { width: 504px !important; } .block-grid.two-up .col { width: 337px !important; } .block-grid.three-up .col { width: 225px !important; } .block-grid.four-up .col { width: 168px !important; } .block-grid.five-up .col { width: 135px !important; } .block-grid.six-up .col { width: 112px !important; } .block-grid.seven-up .col { width: 96px !important; } .block-grid.eight-up .col { width: 84px !important; } .block-grid.nine-up .col { width: 75px !important; } .block-grid.ten-up .col { width: 67px !important; } .block-grid.eleven-up .col { width: 61px !important; } .block-grid.twelve-up .col { width: 56px !important; } } @media (max-width: 695px) { .block-grid, .col { min-width: 320px !important; max-width: 100% !important; display: block !important; } .block-grid { width: 100% !important; } .col { width: 100% !important; } .col>div { margin: 0 auto; } img.fullwidth, img.fullwidthOnMobile { max-width: 100% !important; } .no-stack .col { min-width: 0 !important; display: table-cell !important; } .no-stack.two-up .col { width: 50% !important; } .no-stack .col.num4 { width: 33% !important; } .no-stack .col.num8 { width: 66% !important; } .no-stack .col.num4 { width: 33% !important; } .no-stack .col.num3 { width: 25% !important; } .no-stack .col.num6 { width: 50% !important; } .no-stack .col.num9 { width: 75% !important; } .video-block { max-width: none !important; } .mobile_hide { min-height: 0px; max-height: 0px; max-width: 0px; display: none; overflow: hidden; font-size: 0px; } .desktop_hide { display: block !important; max-height: none !important; } } </style> </head> <body class="clean-body" style="margin: 0; padding: 0; -webkit-text-size-adjust: 100%; background-color: #0956e6;"> <style id="media-query-bodytag" type="text/css"> @media (max-width: 695px) { .block-grid { min-width: 320px!important; max-width: 100%!important; width: 100%!important; display: block!important; } .col { min-width: 320px!important; max-width: 100%!important; width: 100%!important; display: block!important; } .col > div { margin: 0 auto; } img.fullwidth { max-width: 100%!important; height: auto!important; } img.fullwidthOnMobile { max-width: 100%!important; height: auto!important; } .no-stack .col { min-width: 0!important; display: table-cell!important; } .no-stack.two-up .col { width: 50%!important; } .no-stack.mixed-two-up .col.num4 { width: 33%!important; } .no-stack.mixed-two-up .col.num8 { width: 66%!important; } .no-stack.three-up .col.num4 { width: 33%!important } .no-stack.four-up .col.num3 { width: 25%!important } } </style> <!--[if IE]><div class="ie-browser"><![endif]--> <table bgcolor="#0956e6" cellpadding="0" cellspacing="0" class="nl-container" role="presentation" style="table-layout: fixed; vertical-align: top; min-width: 320px; Margin: 0 auto; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #0956e6; width: 100%;" valign="top" width="100%"> <tbody> <tr style="vertical-align: top;" valign="top"> <td style="word-break: break-word; vertical-align: top; border-collapse: collapse;" valign="top"> <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color:#0956e6"><![endif]--> <div style="background-color:transparent;"> <div class="block-grid" style="Margin: 0 auto; min-width: 320px; max-width: 675px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; background-color: transparent;;"> <div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;"> <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:transparent;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:675px"><tr class="layout-full-width" style="background-color:transparent"><![endif]--> <!--[if (mso)|(IE)]><td align="center" width="675" style="background-color:transparent;width:675px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:5px; padding-bottom:5px;"><![endif]--> <div class="col num12" style="min-width: 320px; max-width: 675px; display: table-cell; vertical-align: top;;"> <div style="width:100% !important;"> <!--[if (!mso)&(!IE)]><!--> <div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:5px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;"> <!--<![endif]--> <table border="0" cellpadding="0" cellspacing="0" class="divider" role="presentation" style="table-layout: fixed; vertical-align: top; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; min-width: 100%; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;" valign="top" width="100%"> <tbody> <tr style="vertical-align: top;" valign="top"> <td class="divider_inner" style="word-break: break-word; vertical-align: top; min-width: 100%; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; padding-top: 10px; padding-right: 10px; padding-bottom: 10px; padding-left: 10px; border-collapse: collapse;" valign="top"> <table align="center" border="0" cellpadding="0" cellspacing="0" class="divider_content" height="15" role="presentation" style="table-layout: fixed; vertical-align: top; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; border-top: 0px solid transparent; height: 15px;" valign="top" width="100%"> <tbody> <tr style="vertical-align: top;" valign="top"> <td height="15" style="word-break: break-word; vertical-align: top; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; border-collapse: collapse;" valign="top"><span></span></td> </tr> </tbody> </table> </td> </tr> </tbody> </table> <!--[if (!mso)&(!IE)]><!--> </div> <!--<![endif]--> </div> </div> <!--[if (mso)|(IE)]></td></tr></table><![endif]--> <!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]--> </div> </div> </div> <div style="background-color:transparent;"> <div class="block-grid" style="Margin: 0 auto; min-width: 320px; max-width: 675px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; background-color: transparent;;"> <div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;"> <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:transparent;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:675px"><tr class="layout-full-width" style="background-color:transparent"><![endif]--> <!--[if (mso)|(IE)]><td align="center" width="675" style="background-color:transparent;width:675px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:0px; padding-bottom:0px;"><![endif]--> <div class="col num12" style="min-width: 320px; max-width: 675px; display: table-cell; vertical-align: top;;"> <div style="width:100% !important;"> <!--[if (!mso)&(!IE)]><!--> <div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:0px; padding-bottom:0px; padding-right: 0px; padding-left: 0px;"> <!--<![endif]--> <div align="center" class="img-container center autowidth fullwidth" style="padding-right: 0px;padding-left: 0px;"> <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr style="line-height:0px"><td style="padding-right: 0px;padding-left: 0px;" align="center"><![endif]--><img align="center" alt="Image" border="0" class="center autowidth fullwidth" src="images/top_rounded.png" style="outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; clear: both; border: 0; height: auto; float: none; width: 100%; max-width: 675px; display: block;" title="Image" width="675"/> <!--[if mso]></td></tr></table><![endif]--> </div> <!--[if (!mso)&(!IE)]><!--> </div> <!--<![endif]--> </div> </div> <!--[if (mso)|(IE)]></td></tr></table><![endif]--> <!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]--> </div> </div> </div> <div style="background-color:transparent;"> <div class="block-grid" style="Margin: 0 auto; min-width: 320px; max-width: 675px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; background-color: #FFFFFF;;"> <div style="border-collapse: collapse;display: table;width: 100%;background-color:#FFFFFF;"> <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:transparent;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:675px"><tr class="layout-full-width" style="background-color:#FFFFFF"><![endif]--> <!--[if (mso)|(IE)]><td align="center" width="675" style="background-color:#FFFFFF;width:675px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:5px; padding-bottom:0px;"><![endif]--> <div class="col num12" style="min-width: 320px; max-width: 675px; display: table-cell; vertical-align: top;;"> <div style="width:100% !important;"> <!--[if (!mso)&(!IE)]><!--> <div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:5px; padding-bottom:0px; padding-right: 0px; padding-left: 0px;"> <!--<![endif]--> <div align="center" class="img-container center fixedwidth" style="padding-right: 25px;padding-left: 25px;"> <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr style="line-height:0px"><td style="padding-right: 25px;padding-left: 25px;" align="center"><![endif]--> <div style="font-size:1px;line-height:5px"> </div><img align="center" alt="Image" border="0" class="center fixedwidth" src="images/Turf Town Logo.png" style="outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; clear: both; border: 0; height: auto; float: none; width: 100%; max-width: 118px; display: block;" title="Image" width="118"/> <div style="font-size:1px;line-height:15px"> </div> <!--[if mso]></td></tr></table><![endif]--> </div> <table border="0" cellpadding="0" cellspacing="0" class="divider" role="presentation" style="table-layout: fixed; vertical-align: top; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; min-width: 100%; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;" valign="top" width="100%"> <tbody> <tr style="vertical-align: top;" valign="top"> <td class="divider_inner" style="word-break: break-word; vertical-align: top; min-width: 100%; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; padding-top: 10px; padding-right: 10px; padding-bottom: 10px; padding-left: 10px; border-collapse: collapse;" valign="top"> <table align="center" border="0" cellpadding="0" cellspacing="0" class="divider_content" role="presentation" style="table-layout: fixed; vertical-align: top; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; border-top: 1px solid #BBBBBB;" valign="top" width="100%"> <tbody> <tr style="vertical-align: top;" valign="top"> <td style="word-break: break-word; vertical-align: top; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; border-collapse: collapse;" valign="top"><span></span></td> </tr> </tbody> </table> </td> </tr> </tbody> </table> <!--[if (!mso)&(!IE)]><!--> </div> <!--<![endif]--> </div> </div> <!--[if (mso)|(IE)]></td></tr></table><![endif]--> <!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]--> </div> </div> </div> <div style="background-color:#0956e6;"> <div class="block-grid" style="Margin: 0 auto; min-width: 320px; max-width: 675px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; background-color: #FFFFFF;;"> <div style="border-collapse: collapse;display: table;width: 100%;background-color:#FFFFFF;"> <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0956e6;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:675px"><tr class="layout-full-width" style="background-color:#FFFFFF"><![endif]--> <!--[if (mso)|(IE)]><td align="center" width="675" style="background-color:#FFFFFF;width:675px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:5px; padding-bottom:30px;"><![endif]--> <div class="col num12" style="min-width: 320px; max-width: 675px; display: table-cell; vertical-align: top;;"> <div style="width:100% !important;"> <!--[if (!mso)&(!IE)]><!--> <div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:5px; padding-bottom:30px; padding-right: 0px; padding-left: 0px;"> <!--<![endif]--> <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 50px; padding-left: 50px; padding-top: 0px; padding-bottom: 20px; font-family: Arial, sans-serif"><![endif]--> <div style="color:#FFFFFF;font-family:Arial, "Helvetica Neue", Helvetica, sans-serif;line-height:180%;padding-top:0px;padding-right:50px;padding-bottom:20px;padding-left:50px;"> <p style="font-size: 12px; line-height: 27px; color: #FFFFFF; font-family: Arial, "Helvetica Neue", Helvetica, sans-serif; margin: 0;"><span style="color: #333333; font-size: 15px;">Hi Mahesh,</span></p> <p dir="ltr" style="font-size: 12px; line-height: 21px; color: #FFFFFF; font-family: Arial, "Helvetica Neue", Helvetica, sans-serif; margin: 0;"> </p> <p dir="ltr" style="font-size: 12px; line-height: 27px; color: #FFFFFF; font-family: Arial, "Helvetica Neue", Helvetica, sans-serif; margin: 0;"><span style="color: #000000; font-size: 15px;">Thanks for using Turf Town! Your booking has been confirmed for Wednesday,  22<sup>nd </sup>May.</span></p> </div> <!--[if mso]></td></tr></table><![endif]--> <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 50px; padding-left: 50px; padding-top: 0px; padding-bottom: 20px; font-family: Arial, sans-serif"><![endif]--> <div style="color:#FFFFFF;font-family:Arial, "Helvetica Neue", Helvetica, sans-serif;line-height:180%;padding-top:0px;padding-right:50px;padding-bottom:20px;padding-left:50px;"> <div style="font-size: 12px; line-height: 21px; color: #FFFFFF; font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;"> <p style="font-size: 14px; line-height: 19px; text-align: center; margin: 0;"><span style="font-size: 11px;">*Offer ends at 2019 Lorem ipsum</span></p> </div> </div> <!--[if mso]></td></tr></table><![endif]--> <!--[if (!mso)&(!IE)]><!--> </div> <!--<![endif]--> </div> </div> <!--[if (mso)|(IE)]></td></tr></table><![endif]--> <!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]--> </div> </div> </div> <div style="background-color:transparent;"> <div class="block-grid" style="Margin: 0 auto; min-width: 320px; max-width: 675px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; background-color: #FFFFFF;;"> <div style="border-collapse: collapse;display: table;width: 100%;background-color:#FFFFFF;"> <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:transparent;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:675px"><tr class="layout-full-width" style="background-color:#FFFFFF"><![endif]--> <!--[if (mso)|(IE)]><td align="center" width="675" style="background-color:#FFFFFF;width:675px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:15px; padding-bottom:15px;"><![endif]--> <div class="col num12" style="min-width: 320px; max-width: 675px; display: table-cell; vertical-align: top;;"> <div style="width:100% !important;"> <!--[if (!mso)&(!IE)]><!--> <div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:15px; padding-bottom:15px; padding-right: 0px; padding-left: 0px;"> <!--<![endif]--> <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 50px; padding-left: 50px; padding-top: 15px; padding-bottom: 15px; font-family: Arial, sans-serif"><![endif]--> <div style="color:#555555;font-family:Arial, "Helvetica Neue", Helvetica, sans-serif;line-height:150%;padding-top:15px;padding-right:50px;padding-bottom:15px;padding-left:50px;"> <p style="font-size: 12px; line-height: 18px; color: #555555; font-family: Arial, "Helvetica Neue", Helvetica, sans-serif; margin: 0;"><br/></p> </div> <!--[if mso]></td></tr></table><![endif]--> <table border="0" cellpadding="0" cellspacing="0" class="divider" role="presentation" style="table-layout: fixed; vertical-align: top; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; min-width: 100%; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;" valign="top" width="100%"> <tbody> <tr style="vertical-align: top;" valign="top"> <td class="divider_inner" style="word-break: break-word; vertical-align: top; min-width: 100%; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; padding-top: 10px; padding-right: 10px; padding-bottom: 10px; padding-left: 10px; border-collapse: collapse;" valign="top"> <table align="center" border="0" cellpadding="0" cellspacing="0" class="divider_content" role="presentation" style="table-layout: fixed; vertical-align: top; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; border-top: 1px solid #BBBBBB;" valign="top" width="100%"> <tbody> <tr style="vertical-align: top;" valign="top"> <td style="word-break: break-word; vertical-align: top; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; border-collapse: collapse;" valign="top"><span></span></td> </tr> </tbody> </table> </td> </tr> </tbody> </table> <!--[if (!mso)&(!IE)]><!--> </div> <!--<![endif]--> </div> </div> <!--[if (mso)|(IE)]></td></tr></table><![endif]--> <!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]--> </div> </div> </div> <div style="background-color:transparent;"> <div class="block-grid four-up" style="Margin: 0 auto; min-width: 320px; max-width: 675px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; background-color: #FFFFFF;;"> <div style="border-collapse: collapse;display: table;width: 100%;background-color:#FFFFFF;"> <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:transparent;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:675px"><tr class="layout-full-width" style="background-color:#FFFFFF"><![endif]--> <!--[if (mso)|(IE)]><td align="center" width="168" style="background-color:#FFFFFF;width:168px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:5px; padding-bottom:5px;"><![endif]--> <div class="col num3" style="max-width: 320px; min-width: 168px; display: table-cell; vertical-align: top;;"> <div style="width:100% !important;"> <!--[if (!mso)&(!IE)]><!--> <div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:5px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;"> <!--<![endif]--> <div></div> <!--[if (!mso)&(!IE)]><!--> </div> <!--<![endif]--> </div> </div> <!--[if (mso)|(IE)]></td></tr></table><![endif]--> <!--[if (mso)|(IE)]></td><td align="center" width="168" style="background-color:#FFFFFF;width:168px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:5px; padding-bottom:5px;"><![endif]--> <div class="col num3" style="max-width: 320px; min-width: 168px; display: table-cell; vertical-align: top;;"> <div style="width:100% !important;"> <!--[if (!mso)&(!IE)]><!--> <div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:5px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;"> <!--<![endif]--> <div></div> <!--[if (!mso)&(!IE)]><!--> </div> <!--<![endif]--> </div> </div> <!--[if (mso)|(IE)]></td></tr></table><![endif]--> <!--[if (mso)|(IE)]></td><td align="center" width="168" style="background-color:#FFFFFF;width:168px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:5px; padding-bottom:5px;"><![endif]--> <div class="col num3" style="max-width: 320px; min-width: 168px; display: table-cell; vertical-align: top;;"> <div style="width:100% !important;"> <!--[if (!mso)&(!IE)]><!--> <div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:5px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;"> <!--<![endif]--> <div></div> <!--[if (!mso)&(!IE)]><!--> </div> <!--<![endif]--> </div> </div> <!--[if (mso)|(IE)]></td></tr></table><![endif]--> <!--[if (mso)|(IE)]></td><td align="center" width="168" style="background-color:#FFFFFF;width:168px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:5px; padding-bottom:5px;"><![endif]--> <div class="col num3" style="max-width: 320px; min-width: 168px; display: table-cell; vertical-align: top;;"> <div style="width:100% !important;"> <!--[if (!mso)&(!IE)]><!--> <div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:5px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;"> <!--<![endif]--> <div></div> <!--[if (!mso)&(!IE)]><!--> </div> <!--<![endif]--> </div> </div> <!--[if (mso)|(IE)]></td></tr></table><![endif]--> <!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]--> </div> </div> </div> <div style="background-color:transparent;"> <div class="block-grid" style="Margin: 0 auto; min-width: 320px; max-width: 675px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; background-color: transparent;;"> <div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;"> <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:transparent;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:675px"><tr class="layout-full-width" style="background-color:transparent"><![endif]--> <!--[if (mso)|(IE)]><td align="center" width="675" style="background-color:transparent;width:675px; border-top: 0px dashed transparent; border-left: 0px dashed transparent; border-bottom: 0px dashed transparent; border-right: 0px dashed transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:0px; padding-bottom:0px;"><![endif]--> <div class="col num12" style="min-width: 320px; max-width: 675px; display: table-cell; vertical-align: top;;"> <div style="width:100% !important;"> <!--[if (!mso)&(!IE)]><!--> <div style="border-top:0px dashed transparent; border-left:0px dashed transparent; border-bottom:0px dashed transparent; border-right:0px dashed transparent; padding-top:0px; padding-bottom:0px; padding-right: 0px; padding-left: 0px;"> <!--<![endif]--> <div align="center" class="img-container center autowidth fullwidth" style="padding-right: 0px;padding-left: 0px;"> <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr style="line-height:0px"><td style="padding-right: 0px;padding-left: 0px;" align="center"><![endif]--><img align="center" alt="Image" border="0" class="center autowidth fullwidth" src="images/bottom_rounded.png" style="outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; clear: both; border: 0; height: auto; float: none; width: 100%; max-width: 675px; display: block;" title="Image" width="675"/> <div style="font-size:1px;line-height:15px"> </div> <!--[if mso]></td></tr></table><![endif]--> </div> <!--[if (!mso)&(!IE)]><!--> </div> <!--<![endif]--> </div> </div> <!--[if (mso)|(IE)]></td></tr></table><![endif]--> <!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]--> </div> </div> </div> <div style="background-color:transparent;"> <div class="block-grid two-up no-stack" style="Margin: 0 auto; min-width: 320px; max-width: 675px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; background-color: transparent;;"> <div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;"> <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:transparent;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:675px"><tr class="layout-full-width" style="background-color:transparent"><![endif]--> <!--[if (mso)|(IE)]><td align="center" width="337" style="background-color:transparent;width:337px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:15px; padding-bottom:40px;"><![endif]--> <div class="col num6" style="min-width: 320px; max-width: 337px; display: table-cell; vertical-align: top;;"> <div style="width:100% !important;"> <!--[if (!mso)&(!IE)]><!--> <div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:15px; padding-bottom:40px; padding-right: 0px; padding-left: 0px;"> <!--<![endif]--> <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px; font-family: Arial, sans-serif"><![endif]--> <div style="color:#1a1953;font-family:Arial, "Helvetica Neue", Helvetica, sans-serif;line-height:120%;padding-top:10px;padding-right:10px;padding-bottom:10px;padding-left:10px;"> <div style="font-size: 12px; line-height: 14px; color: #1a1953; font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;"> <p style="font-size: 14px; line-height: 13px; margin: 0;"><span style="font-size: 11px;"><strong>ConnectApp </strong>Connect your lorem ipsum<br/>Cremona road, 283 - Italy </span></p> </div> </div> <!--[if mso]></td></tr></table><![endif]--> <!--[if (!mso)&(!IE)]><!--> </div> <!--<![endif]--> </div> </div> <!--[if (mso)|(IE)]></td></tr></table><![endif]--> <!--[if (mso)|(IE)]></td><td align="center" width="337" style="background-color:transparent;width:337px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:20px; padding-bottom:5px;"><![endif]--> <div class="col num6" style="min-width: 320px; max-width: 337px; display: table-cell; vertical-align: top;;"> <div style="width:100% !important;"> <!--[if (!mso)&(!IE)]><!--> <div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:20px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;"> <!--<![endif]--> <div></div> <!--[if (!mso)&(!IE)]><!--> </div> <!--<![endif]--> </div> </div> <!--[if (mso)|(IE)]></td></tr></table><![endif]--> <!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]--> </div> </div> </div> <!--[if (mso)|(IE)]></td></tr></table><![endif]--> </td> </tr> </tbody> </table> <!--[if (IE)]></div><![endif]--> </body> </html> '

module.exports = {server,merge,isEmpty,htmlEmail}



// {
//     "configuration": {
//         "id": 0,
//         "A/C": 1,
//         "NON-A/C": 2,
//         "base_type": "7s",
//         "ratio": {
//             "A/C": 2,
//             "7s": 1
//         },
//         "types": [
//             "A/C",
//             "NON-A/C"
//         ],
//         "pricing": {
//             "monday": {
//                 "0000-0230": {
//                     "9s": 2000,
//                     "7s": 1700,
//                     "5s": 1500
//                 },
//                 "0230-0800": {
//                     "9s": 2000,
//                     "7s": 1700,
//                     "5s": 1500
//                 },
//                 "0800-1230": {
//                     "9s": 2000,
//                     "7s": 1700,
//                     "5s": 1500
//                 },
//                 "1230-1900": {
//                     "9s": 2000,
//                     "7s": 1700,
//                     "5s": 1500
//                 },
//                 "1900-0000": {
//                     "9s": 2000,
//                     "7s": 1700,
//                     "5s": 1500
//                 }
//             },
//             "tuesday": {
//                 "0000-0230": {
//                     "9s": 2000,
//                     "7s": 1700,
//                     "5s": 1500
//                 },
//                 "0230-0800": {
//                     "9s": 2000,
//                     "7s": 1700,
//                     "5s": 1500
//                 },
//                 "0800-1230": {
//                     "9s": 2000,
//                     "7s": 1700,
//                     "5s": 1500
//                 },
//                 "1230-1900": {
//                     "9s": 2000,
//                     "7s": 1700,
//                     "5s": 1500
//                 },
//                 "1900-0000": {
//                     "9s": 2000,
//                     "7s": 1700,
//                     "5s": 1500
//                 }
//             },
//             "wednesday": {
//                 "0000-0230": {
//                     "9s": 2000,
//                     "7s": 1700,
//                     "5s": 1500
//                 },
//                 "0230-0800": {
//                     "9s": 2000,
//                     "7s": 1700,
//                     "5s": 1500
//                 },
//                 "0800-1230": {
//                     "9s": 2000,
//                     "7s": 1700,
//                     "5s": 1500
//                 },
//                 "1230-1900": {
//                     "9s": 2000,
//                     "7s": 1700,
//                     "5s": 1500
//                 },
//                 "1900-0000": {
//                     "9s": 2000,
//                     "7s": 1700,
//                     "5s": 1500
//                 }
//             },
//             "thursday": {
//                 "0000-0230": {
//                     "9s": 2000,
//                     "7s": 1700,
//                     "5s": 1500
//                 },
//                 "0230-0800": {
//                     "9s": 2000,
//                     "7s": 1700,
//                     "5s": 1500
//                 },
//                 "0800-1230": {
//                     "9s": 2000,
//                     "7s": 1700,
//                     "5s": 1500
//                 },
//                 "1230-1900": {
//                     "9s": 2000,
//                     "7s": 1700,
//                     "5s": 1500
//                 },
//                 "1900-0000": {
//                     "9s": 2000,
//                     "7s": 1700,
//                     "5s": 1500
//                 }
//             },
//             "friday": {
//                 "0000-0230": {
//                     "9s": 2000,
//                     "7s": 1700,
//                     "5s": 1500
//                 },
//                 "0230-0800": {
//                     "9s": 2000,
//                     "7s": 1700,
//                     "5s": 1500
//                 },
//                 "0800-1230": {
//                     "9s": 2000,
//                     "7s": 1700,
//                     "5s": 1500
//                 },
//                 "1230-1900": {
//                     "9s": 2000,
//                     "7s": 1700,
//                     "5s": 1500
//                 },
//                 "1900-0000": {
//                     "9s": 2000,
//                     "7s": 1700,
//                     "5s": 1500
//                 }
//             },
//             "saturday": {
//                 "0000-0230": {
//                     "9s": 2000,
//                     "7s": 1700,
//                     "5s": 1500
//                 },
//                 "0230-0800": {
//                     "9s": 2000,
//                     "7s": 1700,
//                     "5s": 1500
//                 },
//                 "0800-1230": {
//                     "9s": 2000,
//                     "7s": 1700,
//                     "5s": 1500
//                 },
//                 "1230-1900": {
//                     "9s": 2000,
//                     "7s": 1700,
//                     "5s": 1500
//                 },
//                 "1900-0000": {
//                     "9s": 2000,
//                     "7s": 1700,
//                     "5s": 1500
//                 }
//             },
//             "sunday": {
//                 "0000-0230": {
//                     "9s": 2000,
//                     "7s": 1700,
//                     "5s": 1500
//                 },
//                 "0230-0800": {
//                     "9s": 2000,
//                     "7s": 1700,
//                     "5s": 1500
//                 },
//                 "0800-1230": {
//                     "9s": 2000,
//                     "7s": 1700,
//                     "5s": 1500
//                 },
//                 "1230-1900": {
//                     "9s": 2000,
//                     "7s": 1700,
//                     "5s": 1500
//                 },
//                 "1900-0000": {
//                     "9s": 2000,
//                     "7s": 1700,
//                     "5s": 1500
//                 }
//             }
//         }
//     },
//     "exclusive": false,
//     "upto": "9v9",
//     "outs": true,
//     "bank": {
//         "bank_name": "SBI",
//         "ifsc": "",
//         "account_name": "John Doe",
//         "account_no": 1234565432345,
//         "account_type": "",
//         "gst": "",
//         "cheque": "",
//         "commission": ""
//     },
//     "features": {
//         "parking": true,
//         "toilet": true,
//         "water": true,
//         "dressing_rooms": true,
//         "showers": true,
//         "wallet": true,
//         "benches": true,
//         "lockers": true,
//         "paytm": true,
//         "card": true,
//         "bibs": true
//     },
//     "venue": {
//         "name": "ShuttleCork",
//         "type": "Badminton",
//         "address": "17 lakshmi st",
//         "area": "Kilpauk",
//         "pincode": 600010,
//         "google_link": "",
//         "contact": "7401415754"
//     }
// }