import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BarcodeFormat, BrowserCodeReader, BrowserMultiFormatReader } from '@zxing/browser';
import { checkInBooking } from '../api/bookingApi';
import BackButton from '../components/BackButton';
import { signalAppDataChanged } from '../utils/dataSync';
import { LuCamera, LuScanLine, LuShieldAlert } from 'react-icons/lu';

const SCAN_COOLDOWN_MS = 3000;
const CAMERA_MODES = {
  auto: 'auto',
  user: 'user',
};

const createQrReader = () => {
  const reader = new BrowserMultiFormatReader();
  reader.possibleFormats = [BarcodeFormat.QR_CODE];
  return reader;
};

const parseQrPayload = (value) => {
  const normalized = String(value || '').trim();
  const parts = normalized.split('|').map((part) => part.trim());

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return null;
  }

  return {
    bookingId: parts[0],
    token: `${parts[0]}|${parts[1]}`,
    rawValue: normalized,
  };
};

const isIgnorableScannerError = (errorName) =>
  ['NotFoundException', 'ChecksumException', 'FormatException'].includes(errorName);

const ScanQR = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const controlsRef = useRef(null);
  const lastProcessedRef = useRef({ value: '', at: 0 });
  const checkingInRef = useRef(false);
  const startupFallbackAttemptedRef = useRef(false);
  const cameraHintTimeoutRef = useRef(null);

  const [checkingIn, setCheckingIn] = useState(false);
  const [result, setResult] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [cameraIssue, setCameraIssue] = useState('');
  const [lastScanLabel, setLastScanLabel] = useState('Starting camera...');
  const [cameraMode, setCameraMode] = useState(CAMERA_MODES.auto);
  const [scannerNonce, setScannerNonce] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState('');
  const [uploadFileName, setUploadFileName] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraHint, setCameraHint] = useState('');

  const scannerSupported = useMemo(
    () =>
      typeof navigator !== 'undefined' &&
      Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    []
  );

  const cameraModeLabel =
    cameraMode === CAMERA_MODES.user
      ? 'Front/default camera'
      : 'Automatic camera selection';

  const replaceUploadPreview = (nextUrl = '', nextName = '') => {
    setUploadPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return nextUrl;
    });
    setUploadFileName(nextName);
  };

  const recordProcessedValue = (value) => {
    lastProcessedRef.current = {
      value,
      at: Date.now(),
    };
  };

  const isWithinCooldown = (value) => {
    const normalized = String(value || '').trim();
    if (!normalized) return false;

    const { value: previousValue, at } = lastProcessedRef.current;
    return previousValue === normalized && Date.now() - at < SCAN_COOLDOWN_MS;
  };

  const stopScanner = () => {
    try {
      controlsRef.current?.stop?.();
    } catch {
      // ignore stop failures
    }
    controlsRef.current = null;

    const video = videoRef.current;
    if (video) {
      try {
        const stream = video.srcObject;
        if (stream && typeof stream.getTracks === 'function') {
          stream.getTracks().forEach((track) => track.stop());
        }
      } catch {
        // ignore track stop failures
      }

      try {
        BrowserCodeReader.cleanVideoSource(video);
      } catch {
        video.srcObject = null;
      }
    }

    setCameraReady(false);
  };

  const showCameraHint = (message) => {
    if (cameraHintTimeoutRef.current) {
      window.clearTimeout(cameraHintTimeoutRef.current);
    }

    setCameraHint(message);
    cameraHintTimeoutRef.current = window.setTimeout(() => {
      setCameraHint('');
      cameraHintTimeoutRef.current = null;
    }, 4500);
  };

  const ensureScannerReader = () => {
    if (!readerRef.current) {
      readerRef.current = createQrReader();
    }

    return readerRef.current;
  };

  const restartScanner = (nextMode = cameraMode) => {
    startupFallbackAttemptedRef.current = nextMode !== CAMERA_MODES.auto;
    setCameraMode(nextMode);
    setCameraIssue('');
    setCameraReady(false);
    setLastScanLabel('Starting camera...');
    showCameraHint(
      nextMode === CAMERA_MODES.user
        ? 'Front / Default camera selected. Allow browser camera access when prompted to continue.'
        : 'Auto Camera selected. Allow browser camera access if the permission prompt appears.'
    );
    setScannerNonce((current) => current + 1);
  };

  const processCheckIn = async ({ bookingId, token, rawValue, source }) => {
    if (checkingInRef.current || isWithinCooldown(rawValue)) {
      return;
    }

    recordProcessedValue(rawValue);
    checkingInRef.current = true;
    setCheckingIn(true);
    setLastScanLabel(
      source === 'camera'
        ? 'Verifying scanned QR...'
        : source === 'image'
          ? 'Verifying uploaded QR image...'
          : 'Verifying pasted QR...'
    );

    try {
      const data = await checkInBooking(bookingId, token);

      if (data.success) {
        setResult({
          success: true,
          title: 'Check-in verified',
          message: data.message || 'Booking checked in successfully.',
          booking: data.booking,
        });
        toast.success(data.message || 'Check-in successful');
        signalAppDataChanged('bookings');
        stopScanner();
        setCameraIssue('');
        setLastScanLabel('Check-in verified. Camera stopped.');
      } else {
        const message = data.message || 'Check-in failed';
        setResult({
          success: false,
          title: 'Verification failed',
          message,
        });
        toast.error(message);
        setLastScanLabel('Scan another QR code or use manual fallback.');
      }
    } catch (error) {
      console.error('Check-in error:', error);
      setResult({
        success: false,
        title: 'Network error',
        message: 'Could not reach the check-in service. Please try again.',
      });
      toast.error('Error during check-in. Please try again.');
      setLastScanLabel('Scanner is ready when the connection recovers.');
    } finally {
      checkingInRef.current = false;
      setCheckingIn(false);
      setManualInput('');
    }
  };

  const handleInvalidPayload = (rawValue, source) => {
    if (!rawValue || isWithinCooldown(rawValue)) {
      return;
    }

    recordProcessedValue(rawValue);
    const message = 'Invalid QR format. Expected bookingId|token.';
    setResult({
      success: false,
      title: 'Unreadable QR',
      message,
    });
    toast.error(message);
    setLastScanLabel(
      source === 'camera'
        ? 'Try scanning again or use manual token entry.'
        : source === 'image'
          ? 'Try a clearer screenshot or use the manual QR value field.'
        : 'Check the copied QR value and try again.'
    );
  };

  const handleScanText = async (rawValue) => {
    if (!rawValue || checkingInRef.current) {
      return;
    }

    const parsed = parseQrPayload(rawValue);
    if (!parsed) {
      handleInvalidPayload(rawValue, 'camera');
      return;
    }

    await processCheckIn({ ...parsed, source: 'camera' });
  };

  const handleManualSubmit = async (event) => {
    event.preventDefault();
    const parsed = parseQrPayload(manualInput);

    if (!parsed) {
      handleInvalidPayload(manualInput, 'manual');
      return;
    }

    await processCheckIn({ ...parsed, source: 'manual' });
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    replaceUploadPreview(previewUrl, file.name);
    setUploadingImage(true);
    setCameraIssue('');
    setLastScanLabel('Decoding uploaded QR image...');

    try {
      const image = new Image();
      const imageLoaded = new Promise((resolve, reject) => {
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('IMAGE_LOAD_FAILED'));
      });

      image.src = previewUrl;
      await imageLoaded;

      const uploadReader = createQrReader();
      const decodeResult = await uploadReader.decodeFromImageElement(image);
      const rawValue =
        typeof decodeResult?.getText === 'function'
          ? decodeResult.getText()
          : decodeResult?.text || '';

      if (!rawValue) {
        handleInvalidPayload(file.name, 'image');
        return;
      }

      const parsed = parseQrPayload(rawValue);
      if (!parsed) {
        handleInvalidPayload(rawValue, 'image');
        return;
      }

      await processCheckIn({ ...parsed, source: 'image' });
    } catch (error) {
      console.error('Uploaded QR decode error:', error);
      const errorName = String(error?.name || error?.message || '');
      const message =
        errorName === 'NotFoundException'
          ? 'No QR code was detected in that image. Try a clearer screenshot.'
          : 'Could not read the uploaded QR image. Try another screenshot or use manual fallback.';

      setResult({
        success: false,
        title: 'Upload could not be read',
        message,
      });
      toast.error(message);
      setLastScanLabel('Upload another screenshot or use manual token entry.');
    } finally {
      setUploadingImage(false);
    }
  };

  useEffect(() => {
    if (!scannerSupported || !videoRef.current) {
      return undefined;
    }

    let cancelled = false;

    ensureScannerReader();

    const startScanner = async () => {
      setCameraIssue('');
      setLastScanLabel('Starting camera...');

      try {
        let controls;

        if (cameraMode === CAMERA_MODES.auto) {
          controls = await readerRef.current.decodeFromVideoDevice(
            undefined,
            videoRef.current,
            (scanResult, error) => {
              if (scanResult) {
                const text =
                  typeof scanResult.getText === 'function'
                    ? scanResult.getText()
                    : scanResult?.text || '';
                void handleScanText(text);
              }

              if (error && !isIgnorableScannerError(String(error?.name || ''))) {
                if (error?.name === 'NotAllowedError') {
                  const message = 'Camera permission was denied. Allow camera access in the browser, then retry.';
                  setCameraIssue((current) => (current === message ? current : message));
                  setCameraReady(false);
                }
              }
            }
          );
        } else {
          const constraints = {
            audio: false,
            video: { facingMode: 'user' },
          };

          controls = await readerRef.current.decodeFromConstraints(
            constraints,
            videoRef.current,
            (scanResult, error) => {
              if (scanResult) {
                const text =
                  typeof scanResult.getText === 'function'
                    ? scanResult.getText()
                    : scanResult?.text || '';
                void handleScanText(text);
              }

              if (error && !isIgnorableScannerError(String(error?.name || ''))) {
                if (error?.name === 'NotAllowedError') {
                  const message = 'Camera permission was denied. Allow camera access in the browser, then retry.';
                  setCameraIssue((current) => (current === message ? current : message));
                  setCameraReady(false);
                }
              }
            }
          );
        }

        if (cancelled) {
          controls?.stop?.();
          return;
        }

        controlsRef.current = controls;
        setCameraReady(true);
        setLastScanLabel('Point the camera at a booking QR code.');
      } catch (error) {
        if (cancelled) {
          return;
        }

        const errorName = String(error?.name || '');

        if (
          !startupFallbackAttemptedRef.current &&
          cameraMode !== CAMERA_MODES.auto &&
          ['OverconstrainedError', 'NotFoundError', 'NotReadableError', 'TrackStartError'].includes(errorName)
        ) {
          startupFallbackAttemptedRef.current = true;
          setCameraMode(CAMERA_MODES.auto);
          setScannerNonce((current) => current + 1);
          setCameraIssue('The selected camera mode was unavailable, so the scanner switched back to automatic camera selection.');
          setLastScanLabel('Retrying camera automatically...');
          return;
        }

        const issue =
          errorName === 'NotAllowedError'
            ? 'Camera permission was denied. Allow camera access in the browser, then reload or retry.'
            : errorName === 'NotReadableError'
              ? 'The camera is busy in another app or browser tab. Close the other camera use, then retry.'
              : errorName === 'OverconstrainedError'
                ? 'This device does not support the requested camera mode. Try Auto Camera or Front / Default.'
                : 'Camera scanning is unavailable on this device or browser. Try Auto Camera, Front / Default, or the upload/manual options.';

        setCameraIssue(issue);
        setCameraReady(false);
        setLastScanLabel('Camera could not start.');
      }
    };

    void startScanner();

    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [cameraMode, scannerNonce, scannerSupported]);

  useEffect(() => () => stopScanner(), []);

  useEffect(() => {
    return () => {
      if (cameraHintTimeoutRef.current) {
        window.clearTimeout(cameraHintTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (uploadPreviewUrl) {
        URL.revokeObjectURL(uploadPreviewUrl);
      }
    };
  }, [uploadPreviewUrl]);

  const handleReset = () => {
    setResult(null);
    setManualInput('');
    setCameraIssue('');
    setLastScanLabel('Starting camera...');
    lastProcessedRef.current = { value: '', at: 0 };
    replaceUploadPreview();
    restartScanner(CAMERA_MODES.auto);
  };

  const resultBooking = result?.booking;
  const resourceName =
    resultBooking && typeof resultBooking.resourceId === 'object'
      ? resultBooking.resourceId.name
      : 'Resource';
  const bookingOwner =
    resultBooking && typeof resultBooking.userId === 'object'
      ? resultBooking.userId.name
      : 'Booking user';

  return (
    <div className="min-h-screen px-4 py-8 bg-gradient-to-br from-slate-100 via-blue-50 to-cyan-100">
      <div className="max-w-5xl mx-auto">
        <BackButton label="Admin approvals" to="/admin/approvals" fallback="/admin/approvals" />

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
          <section className="p-6 bg-white border border-white shadow-xl rounded-3xl">
            <p className="text-sm font-semibold tracking-[0.22em] uppercase text-blue-700">
              Admin Scanner
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
              Venue Check-In Verification
            </h1>
            <p className="mt-3 text-base text-slate-600">
              Scan an approved booking QR code. All token validation and booking rules are still enforced by the existing backend check-in flow.
            </p>

            <div className="mt-6 overflow-hidden border border-slate-200 rounded-3xl bg-slate-950">
              {scannerSupported ? (
                <div className="relative w-full pt-[70%] bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35),_rgba(15,23,42,0.96)_55%)]">
                  <video
                    ref={videoRef}
                    muted
                    playsInline
                    autoPlay
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                      cameraReady ? 'opacity-100' : 'opacity-0'
                    }`}
                  />

                  <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
                    <div className="w-full max-w-sm">
                      <div className="relative mx-auto h-60 rounded-[2rem] border border-white/20 bg-slate-950/35 shadow-[0_25px_80px_rgba(15,23,42,0.4)] backdrop-blur-sm">
                        <div className="absolute inset-6 rounded-[1.75rem] border border-cyan-300/45">
                          <div className="absolute w-10 h-10 border-t-4 border-l-4 rounded-tl-2xl border-cyan-300 -top-1 -left-1" />
                          <div className="absolute w-10 h-10 border-t-4 border-r-4 rounded-tr-2xl border-cyan-300 -top-1 -right-1" />
                          <div className="absolute w-10 h-10 border-b-4 border-l-4 rounded-bl-2xl border-cyan-300 -bottom-1 -left-1" />
                          <div className="absolute w-10 h-10 border-b-4 border-r-4 rounded-br-2xl border-cyan-300 -bottom-1 -right-1" />
                        </div>

                        <div className="absolute inset-x-8 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent shadow-[0_0_18px_rgba(103,232,249,0.9)]" />

                        {!cameraReady && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
                            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 border border-white/15">
                              <LuScanLine className="w-7 h-7 text-cyan-200" />
                            </div>
                            <p className="mt-4 text-base font-semibold">
                              {cameraIssue ? 'Camera not ready yet' : 'Waiting for camera permission'}
                            </p>
                            <p className="max-w-xs mt-2 text-sm leading-6 text-slate-200">
                              {cameraIssue
                                ? 'Retry a camera mode below, or use image upload and manual fallback.'
                                : 'Choose a camera mode, then allow camera access when the browser permission prompt appears.'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center min-h-[22rem] px-6 text-center text-slate-200">
                  <p>Camera scanning is not available in this browser. Use manual token entry below.</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 mt-4">
              <button
                type="button"
                onClick={() => restartScanner(CAMERA_MODES.auto)}
                className={`px-4 py-2 text-sm font-semibold rounded-xl border ${
                  cameraMode === CAMERA_MODES.auto
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Auto Camera
              </button>
              <button
                type="button"
                onClick={() => restartScanner(CAMERA_MODES.user)}
                className={`px-4 py-2 text-sm font-semibold rounded-xl border ${
                  cameraMode === CAMERA_MODES.user
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Front / Default
              </button>
            </div>

            {cameraHint && (
              <div className="flex gap-3 p-4 mt-4 border border-blue-200 rounded-2xl bg-blue-50">
                <LuShieldAlert className="w-5 h-5 mt-0.5 text-blue-700" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">Camera permission reminder</p>
                  <p className="mt-1 text-sm text-blue-800">{cameraHint}</p>
                </div>
              </div>
            )}

            <div className="grid gap-3 mt-4 sm:grid-cols-2">
              <div className="p-4 border border-blue-100 rounded-2xl bg-blue-50">
                <p className="text-xs font-bold tracking-[0.18em] uppercase text-blue-700">
                  Scanner Status
                </p>
                <p className="mt-2 text-sm font-medium text-slate-800">
                  {checkingIn ? 'Verifying with server...' : lastScanLabel}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                  <LuCamera className="w-4 h-4" />
                  <span>{cameraModeLabel}</span>
                </div>
              </div>
              <div className="p-4 border border-amber-100 rounded-2xl bg-amber-50">
                <p className="text-xs font-bold tracking-[0.18em] uppercase text-amber-700">
                  Safety
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  Duplicate reads of the same QR are ignored briefly to prevent repeated submissions.
                </p>
              </div>
            </div>

            {cameraIssue && (
              <div className="p-4 mt-4 border border-amber-200 rounded-2xl bg-amber-50">
                <p className="text-sm font-semibold text-amber-900">Camera fallback</p>
                <p className="mt-1 text-sm text-amber-800">{cameraIssue}</p>
              </div>
            )}
          </section>

          <section className="space-y-6">
            <div className="p-6 bg-white border border-white shadow-xl rounded-3xl">
              <h2 className="text-xl font-bold text-slate-900">Upload QR Image / Screenshot</h2>
              <p className="mt-2 text-sm text-slate-600">
                Upload a QR screenshot when the code is open in another tab, on another device, or when camera scanning is awkward.
              </p>

              <div className="mt-5 space-y-4">
                <label className="inline-flex items-center px-5 py-3 font-semibold text-white bg-indigo-600 rounded-2xl cursor-pointer hover:bg-indigo-700">
                  {uploadingImage ? 'Reading image...' : 'Choose QR Image'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage || checkingIn}
                    className="sr-only"
                  />
                </label>

                {uploadPreviewUrl && (
                  <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold tracking-[0.16em] uppercase text-slate-500">Selected File</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{uploadFileName || 'QR image'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => replaceUploadPreview()}
                        className="px-3 py-2 text-sm font-semibold border rounded-xl border-slate-300 text-slate-700 hover:bg-white"
                      >
                        Clear Image
                      </button>
                    </div>
                    <img
                      src={uploadPreviewUrl}
                      alt="Uploaded QR preview"
                      className="object-contain w-full max-h-64 mt-4 bg-white border border-slate-200 rounded-2xl"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-white border border-white shadow-xl rounded-3xl">
              <h2 className="text-xl font-bold text-slate-900">Manual Fallback</h2>
              <p className="mt-2 text-sm text-slate-600">
                Paste the QR value if the camera is blocked, unsupported, or the code is hard to read.
              </p>

              <form onSubmit={handleManualSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    Booking QR value
                  </label>
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(event) => setManualInput(event.target.value)}
                    placeholder="bookingId|token"
                    className="w-full px-4 py-3 mt-2 font-mono text-sm border border-slate-300 rounded-2xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                    disabled={checkingIn}
                    autoComplete="off"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Use the same QR value already generated for the booking. This still submits to the current backend check-in endpoint.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={checkingIn || !manualInput.trim()}
                    className="px-5 py-3 font-semibold text-white bg-blue-600 rounded-2xl hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {checkingIn ? 'Verifying...' : 'Verify Booking'}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-5 py-3 font-semibold border rounded-2xl border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Reset State
                  </button>
                </div>
              </form>
            </div>

            <div
              className={`p-6 border shadow-xl rounded-3xl ${
                result?.success
                  ? 'border-emerald-200 bg-emerald-50'
                  : result
                    ? 'border-red-200 bg-red-50'
                    : 'border-white bg-white'
              }`}
            >
              <h2 className="text-xl font-bold text-slate-900">Latest Result</h2>

              {!result && (
                <p className="mt-3 text-sm text-slate-600">
                  Scan a booking QR code or paste a QR value to see the verification result here.
                </p>
              )}

              {result && (
                <div className="mt-4 space-y-3">
                  <div>
                    <p
                      className={`text-sm font-bold uppercase tracking-[0.18em] ${
                        result.success ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      {result.title}
                    </p>
                    <p className={`mt-2 text-sm ${result.success ? 'text-emerald-900' : 'text-red-900'}`}>
                      {result.message}
                    </p>
                  </div>

                  {resultBooking && (
                    <div className="grid gap-3 p-4 border border-white/70 rounded-2xl bg-white/80">
                      <div>
                        <p className="text-xs font-bold tracking-[0.16em] uppercase text-slate-500">Booking User</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{bookingOwner}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold tracking-[0.16em] uppercase text-slate-500">Resource</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{resourceName}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold tracking-[0.16em] uppercase text-slate-500">Schedule</p>
                        <p className="mt-1 text-sm text-slate-700">
                          {new Date(resultBooking.startTime).toLocaleString()} to{' '}
                          {new Date(resultBooking.endTime).toLocaleString()}
                        </p>
                      </div>
                      {resultBooking.checkInTime && (
                        <div>
                          <p className="text-xs font-bold tracking-[0.16em] uppercase text-slate-500">Checked In At</p>
                          <p className="mt-1 text-sm text-slate-700">
                            {new Date(resultBooking.checkInTime).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800"
                    >
                      Scan Next
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/admin/approvals')}
                      className="px-4 py-2 text-sm font-semibold border rounded-xl border-slate-300 text-slate-700 hover:bg-white/70"
                    >
                      Back to approvals
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ScanQR;
