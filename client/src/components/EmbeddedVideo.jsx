import PropTypes from 'prop-types';
import { getVideoEmbed } from '../utils/videoEmbeds';

export default function EmbeddedVideo({ url, className = '' }) {
  const embed = getVideoEmbed(url);
  if (!embed) return null;

  const sizeClass =
    embed.provider === 'tiktok'
      ? 'max-w-sm mx-auto sm:mx-0'
      : 'w-full';

  return (
    <div
      className={`${sizeClass} overflow-hidden rounded-xl border border-slate-200 bg-slate-950 shadow-sm ${className}`}
    >
      <div className={`${embed.aspectClass} w-full`}>
        <iframe
          src={embed.embedUrl}
          title={embed.title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  );
}

EmbeddedVideo.propTypes = {
  url: PropTypes.string,
  className: PropTypes.string,
};
