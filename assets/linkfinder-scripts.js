(function ()
{
  // eslint-disable-next-line no-undef
  const $ = jQuery;

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
    potential_errors++;
    $($('#linkfinder_statusbar span')[2]).text(potential_errors + ' potential errors');

    if (jqXHR.status < 200 || jqXHR.status >= 300)
    {
      let td_code = $(document.createElement('td'));
      td_code.text(jqXHR.status);

      let td_status = $(document.createElement('td'));
      td_status.text(errorThrown);

      let a_edit = $(document.createElement('a'));
      a_edit
        .attr('href', admin_url + 'post.php?post=' + postid + '&action=edit')
        .attr('target', '_blank')
        .text(linkinfo.post_title);

      let td_post_title = $(document.createElement('td'));
      td_post_title.append(a_edit);

      let td_post_type = $(document.createElement('td'));
      td_post_type.text(linkinfo.post_type);

      let td_link_elem = $(document.createElement('td'));
      td_link_elem.text(linkinfo.hyperlinks[2][index].replace(/(\s|\t|\r|\r?\n)+/g, ' '));

      let oldlink_elem_input_hidden = $(document.createElement('input'));
      oldlink_elem_input_hidden
        .attr('type', 'hidden')
        .attr('name', 'oldlink_elem-' + postid + '-' + index)
        .val(linkinfo.hyperlinks[0][index].replace(/(\s|\t|\r|\r?\n)+/g, ' '));

      // let linkbefore_input_hidden = $(document.createElement('input'))
      // linkbefore_input_hidden
      //   .attr('type', 'hidden')
      //   .attr('name', 'linkbefore-' + postid + '-' + index)
      //   .val(linkinfo.hyperlinks[1][index].replace(/(\s|\t|\r|\r?\n)+/g, ' '))

      // let linkafter_input_hidden = $(document.createElement('input'))
      // linkafter_input_hidden
      //   .attr('type', 'hidden')
      //   .attr('name', 'linkafter-' + postid + '-' + index)
      //   .val(linkinfo.hyperlinks[4][index].replace(/(\s|\t|\r|\r?\n)+/g, ' '))

      let a_link = $(document.createElement('a'));
      a_link
        .attr('href', link_to_validate)
        .attr('target', '_blank')
        .text(hyperlink);

      let td_link = $(document.createElement('td'));
      td_link.append(a_link);

      let a_copy = $(document.createElement('a'));

      let newlink_input = $(document.createElement('input'));
      newlink_input
        .attr('type', 'text')
        .attr('name', 'newlink-' + postid + '-' + index)
        .on('change', function ()
        {
          if ($(this).val())
          {
            /**
             * ADD AN ADDITIONAL "PRE-SUBMIT" AJAX CHECK FOR THE PROVIDED NEW LINK ..
             */
            a_copy.text('X');
          }
          else
          {
            a_copy.text('>>');
          }
        });

      let td_newlink = $(document.createElement('td'));
      td_newlink
        .append(oldlink_elem_input_hidden, newlink_input);

      a_copy
        .attr('href', '#')
        .on('click', function ()
        {
          let elem = $(this);
          if (elem.hasClass('linkfinder-loader'))
          {
            return;
          }
          if (newlink_input.val())
          {
            newlink_input.val('');
            return elem.text('>>');
          }
          elem
            .html('<div></div>')
            .addClass('linkfinder-loader');
          $.ajax({
            url: validator_url,
            method: 'POST',
            data: {
              link: link_to_validate,
              follow: true,
            },
            // crossDomain: !internal_link,
            dataType: 'text',
            success: function (data /*, textStatus, jqXHR*/)
            {
              newlink_input.val(data);
            },
            error: function ( /*jqXHR, textStatus, errorThrown*/)
            {
              newlink_input.val(a_link.text());
            },
            complete: function ( /*jqXHR, textStatus*/)
            {
              elem
                .text('X')
                .removeClass('linkfinder-loader');
            }
          });
        })
        .text('>>')
        .attr('title', 'Follow link and paste final URL to the new hyperlink field.');

      let td_copylink = $(document.createElement('td'));
      td_copylink
        .css('width', '3ch')
        .css('text-align', 'center')
        .append(a_copy);

      let tr = $(document.createElement('tr'));
      tr.append(td_code, td_status, td_post_title, td_post_type, td_link_elem, td_link, td_copylink, td_newlink);

      if (internal_link === null || internal_link === true)
      {
        tr.addClass('linkfinder_tr_warn');
      }
      if (jqXHR.status >= 400 && jqXHR.status < 500)
      {
        tr.addClass('linkfinder_tr_err');
      }

      $('table#linkfinder_table').append(tr);
    }
  }

  window.linkfinder_process_links = function (postid_hyperlinks, home_url, admin_url, validator_url)
  {
    $.each(postid_hyperlinks, function (postid, linkinfo)
    {
      total_count += linkinfo.hyperlinks[3].length;
    });
    if (total_count)
    {
      $($('#linkfinder_statusbar span')[0]).text('0%');
      $($('#linkfinder_statusbar span')[1]).text('0/' + total_count);
      $($('#linkfinder_statusbar span')[2]).text('0 potential errors');
    }

    $.each(postid_hyperlinks, function (postid, linkinfo)
    {

      $.each(linkinfo.hyperlinks[3], function (index, hyperlink)
      {

        hyperlink = $.trim(hyperlink.replace(/(\s|\t|\r|\r?\n)+/g, ' '));

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
              {
                status: 0
              },
              'Empty link'
            );
          }

          return;
        }

        let internal_link = false;
        let link_to_validate = hyperlink;

        /**
         * Check if the hostname of the link is from the same website, if so, it is an internal link.
         */
        if (hyperlink.replace(/^(?:https?:\/\/)?(?:www\.)?/gi, '').startsWith(new URL(home_url).hostname.replace(/^www\./gi, '')))
        {
          internal_link = true;
        }
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
         * If link has no protocol, it is an internal link.
         */
        if (!has_protocol && !/^www\./i.test(hyperlink))
        {
          internal_link = true;
          if (/^(\/|#|\?)/.test(hyperlink))
          {
            /**
             * Path is absolute ..
             */
            link_to_validate = new URL(hyperlink, home_url).href;
          }
          else
          {
            /**
             * Path is relative ..
             */
            link_to_validate = new URL(linkinfo.post_name + '/' + hyperlink, home_url).href;
          }
        }
        /**
         * Ignore link if it is an admin url.
         */
        if (new URL(link_to_validate).pathname.startsWith(new URL(admin_url).pathname))
        {
          links_processed++;
          $($('#linkfinder_statusbar span')[0]).text(Math.round(links_processed / total_count * 100) + '%');
          $($('#linkfinder_statusbar span')[1]).text(links_processed + '/' + total_count);

          return;
        }

        // OVERRIDE !!
        // internal_link = false

        $.ajax({
          url: validator_url, // internal_link ? link_to_validate : validator_url,
          method: 'POST',
          data: {
            link: link_to_validate
          },
          // crossDomain: !internal_link,
          complete: function (jqXHR /*, textStatus*/)
          {
            links_processed++;
            $($('#linkfinder_statusbar span')[0]).text(Math.round(links_processed / total_count * 100) + '%');
            $($('#linkfinder_statusbar span')[1]).text(links_processed + '/' + total_count);

            console.log(jqXHR.status + ' | ' + linkinfo.hyperlinks[0][index].replace(/(\s|\t|\r|\r?\n)+/g, ' '));
          },

          // success: function (data) {
          //   console.log(data)
          // },

          error: function (jqXHR, textStatus, errorThrown)
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
          }
        });
      });
    });
  };
  // eslint-disable-next-line no-undef
})(jQuery);