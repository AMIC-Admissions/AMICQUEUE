import React from 'react';

const TicketBarcode = ({ value, className = '' }) => {
  if (!value) return null;

  return (
    <div className={`w-full text-center ${className}`}>
      <div className="font-barcode text-[92px] leading-none text-[#222D64] sm:text-[110px]">
        *{String(value).toUpperCase()}*
      </div>
      <div className="mt-2 text-xs font-black tracking-[0.45em] text-[#222D64]/70 sm:text-sm">
        {String(value).toUpperCase()}
      </div>
    </div>
  );
};

export default TicketBarcode;
