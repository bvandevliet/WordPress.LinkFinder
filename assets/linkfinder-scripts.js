(function ($)
{
  let total_count = 0;
  let links_processed = 0;
  let potential_errors = 0;

  function print_link_row(
    home_url,
    admin_url,
    validator_url,
    postid,
    linkinfo,
    index,
    hyperlink,
    link_to_validate,
    jqXHR,
    errorThrown,
    internal_link = null
  )
  {
    home_url = home_url.replace(/\/*$/, '');
    admin_url = admin_url.replace(/\/*$/, '');

    potential_errors++;
    $($('#linkfinder_statusbar span')[2]).text(potential_errors + ' potential errors');

    if (jqXHR.status < 200 || jqXHR.status >= 300)
    {
      let $td_code = $('<td/>');
      $td_code.text(jqXHR.status);

      let $td_status = $('<td/>');
      $td_status.text(errorThrown);

      let $a_edit = $('<a/>');
      $a_edit
        .attr('href', admin_url + '/post.php?post=' + postid + '&action=edit')
        .attr('target', '_blank')
        .text(linkinfo.post_title);

      let $td_post_title = $('<td/>');
      $td_post_title.append($a_edit);

      let $td_post_type = $('<td/>');
      $td_post_type.text(linkinfo.post_type);

      let $td_post_status = $('<td/>');
      $td_post_status.text(linkinfo.post_status);

      let $td_link_elem = $('<td/>');
      $td_link_elem.text(linkinfo.hyperlinks[2][index].replace(/([\s\t\v\0\r]|\r?\n)+/g, ' ').trim());

      let $oldlink_elem_input_hidden = $('<input/>');
      $oldlink_elem_input_hidden
        .attr('type', 'hidden')
        .attr('name', 'oldlink_elem-' + postid + '-' + index)
        .val(linkinfo.hyperlinks[0][index].replace(/([\s\t\v\0\r]|\r?\n)+/g, ' ').trim());

      let $a_link = $('<a/>');
      $a_link
        .attr('href', link_to_validate)
        .attr('target', '_blank')
        .text(hyperlink);

      let $td_link = $('<td/>');
      $td_link.append($a_link);

      let $a_copy = $('<a/>');

      let $newlink_input = $('<input/>');
      $newlink_input
        .attr('type', 'text')
        .addClass('regular-text')
        .attr('name', 'newlink-' + postid + '-' + index)
        .attr('placeholder', '(don\'t change)')
        .on('change', () =>
        {
          if ($newlink_input.val())
          {
            /**
             * ADD AN ADDITIONAL "PRE-SUBMIT" AJAX CHECK FOR THE PROVIDED NEW LINK ..
             */
            $a_copy.text('X');
          }
          else
          {
            $a_copy.text('>>');
          }
        });

      let $td_newlink = $('<td/>');
      $td_newlink
        .append($oldlink_elem_input_hidden, $newlink_input);

      $a_copy
        .text('>>')
        .attr('title', 'Follow link and paste final URL to the new hyperlink field.') // HOW TO TRANSLATE ?? !!
        .on('click', () =>
        {
          if ($a_copy.hasClass('linkfinder-loader'))
          {
            return;
          }
          if ($newlink_input.val())
          {
            $newlink_input.val('');
            return $a_copy.text('>>');
          }

          $a_copy
            .html('<div/>')
            .addClass('linkfinder-loader');

          $.ajax({
            url: validator_url,
            method: 'POST',
            data: {
              link: link_to_validate,
              follow: true,
            },
            cache: false,
            timeout: 0,
            headers: {
              // 'Referer': home_url,
              // 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:72.0) Gecko/20100101 Firefox/72.0',
              'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
              'Pragma': 'no-cache',
              'Expires': 'Thu, 01 Jan 1970 00:00:00 GMT',
            },
            // crossDomain: !internal_link,
            dataType: 'json',
            success: (data/*, textStatus, jqXHR*/) =>
            {
              if (data.success)
              {
                $newlink_input.val(data.data.effective_url);
              }
              else
              {
                $newlink_input.val($a_link.text());
              }
            },
            error: (/*jqXHR, textStatus, errorThrown*/) =>
            {
              $newlink_input.val($a_link.text());
            },
            complete: (/*jqXHR, textStatus*/) =>
            {
              $a_copy
                .text('X')
                .removeClass('linkfinder-loader');
            }
          });
        });

      let $td_copylink = $('<td/>');
      $td_copylink
        .css('width', '3ch')
        .css('text-align', 'center')
        .append($a_copy);

      let $tr = $('<tr/>');
      $tr.append($td_code, $td_status, $td_post_title, $td_post_type, $td_post_status, $td_link_elem, $td_link, $td_copylink, $td_newlink);

      if ((internal_link === null || internal_link === true) || (jqXHR.status >= 300 && jqXHR.status < 401))
      {
        $tr.addClass('linkfinder-tr-warn');
      }
      if (jqXHR.status >= 401 && jqXHR.status < 500)
      {
        $tr.addClass('linkfinder-tr-err');
      }

      $('table#linkfinder-table').append($tr);
    }
  }

  window.linkfinder_process_links = (postid_hyperlinks, home_url, admin_url, validator_url) =>
  {
    home_url = home_url.replace(/\/*$/, '');
    admin_url = admin_url.replace(/\/*$/, '');

    $.each(postid_hyperlinks, (postid, linkinfo) =>
    {
      total_count += linkinfo.hyperlinks[3].length;
    });
    if (total_count)
    {
      $($('#linkfinder_statusbar span')[0]).text('0%');
      $($('#linkfinder_statusbar span')[1]).text('0/' + total_count);
      $($('#linkfinder_statusbar span')[2]).text('0 potential errors');
    }

    $.each(postid_hyperlinks, (postid, linkinfo) =>
    {
      $.each(linkinfo.hyperlinks[3], (index, hyperlink) =>
      {
        hyperlink = hyperlink.replace(/([\s\t\v\0\r]|\r?\n)+/g, ' ').trim();

        if (!hyperlink || /^(mailto|tel):/i.test(hyperlink))
        {
          links_processed++;
          $($('#linkfinder_statusbar span')[0]).text(Math.round(links_processed / total_count * 100) + '%');
          $($('#linkfinder_statusbar span')[1]).text(links_processed + '/' + total_count);

          if (!hyperlink)
          {
            print_link_row(
              home_url,
              admin_url,
              validator_url,
              postid,
              linkinfo,
              index,
              hyperlink,
              '',
              { status: 0 },
              'Empty link'
            );
          }

          return true;
        }

        let internal_link = false;
        let link_to_validate = hyperlink;

        /**
         * Check if the hostname of the link is from the same website, if so, it is an internal link.
         */
        internal_link = hyperlink.replace(/^(https?:\/\/)?(www.?\.)?/i, '').startsWith(new URL(home_url).hostname.replace(/^www.?\./i, ''));

        /**
         * Check if the link has a protocol.
         */
        let has_protocol = true;
        try
        {
          new URL(hyperlink).protocol;
        }
        catch (err)
        {
          has_protocol = false;
        }

        /**
         * If link has no protocol, it is expected to be an internal link as well.
         */
        if (!has_protocol && !/^www.?\./i.test(hyperlink))
        {
          internal_link = true;

          /**
           * Path is absolute ..
           */
          if (hyperlink.startsWith('/'))
          {
            try
            {
              link_to_validate = new URL(hyperlink, home_url).href;
            }
            catch (err)
            {
              link_to_validate = home_url + hyperlink;
            }
          }

          /**
           * Path is relative ..
           */
          else
          {
            try
            {
              link_to_validate = new URL(linkinfo.post_name + '/' + hyperlink, home_url).href;
            }
            catch (err)
            {
              link_to_validate = home_url + '/' + linkinfo.post_name + '/' + hyperlink;
            }
          }
        }

        /**
         * Ignore link if it is an admin url.
         */
        if (link_to_validate.replace(home_url, '').startsWith(new URL(admin_url).pathname))
        {
          links_processed++;
          $($('#linkfinder_statusbar span')[0]).text(Math.round(links_processed / total_count * 100) + '%');
          $($('#linkfinder_statusbar span')[1]).text(links_processed + '/' + total_count);

          return true;
        }

        // OVERRIDE !!
        // internal_link = false

        $.ajax({
          url: validator_url, // internal_link ? link_to_validate : validator_url,
          method: 'POST',
          data: {
            link: link_to_validate,
          },
          cache: false,
          timeout: 0,
          headers: {
            // 'Referer': home_url,
            // 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:72.0) Gecko/20100101 Firefox/72.0',
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': 'Thu, 01 Jan 1970 00:00:00 GMT',
          },
          // crossDomain: !internal_link,
          // dataType: 'json',
          error: (jqXHR, textStatus, errorThrown) =>
          {
            print_link_row(
              home_url,
              admin_url,
              validator_url,
              postid,
              linkinfo,
              index,
              hyperlink,
              link_to_validate,
              jqXHR,
              errorThrown,
              internal_link
            );
          },
          complete: (/*jqXHR, textStatus*/) =>
          {
            links_processed++;
            $($('#linkfinder_statusbar span')[0]).text(Math.round(links_processed / total_count * 100) + '%');
            $($('#linkfinder_statusbar span')[1]).text(links_processed + '/' + total_count);
          }
        });
      });
    });
  };
})(jQuery);